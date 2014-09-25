'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var SocketIO = require('socket.io');
var crypto = require('crypto');

var services = require('./lib/services');

nconf.argv().env().file({ file: 'local.json' });

var users = 0;

var options = {
  views: {
    engines: {
      jade: require('jade')
    },
    isCached: process.env.node === 'production',
    path: __dirname + '/views',
    compileOptions: {
      pretty: true
    }
  }
};

var server = Hapi.createServer(nconf.get('domain'), nconf.get('port'), options);

server.pack.register(require('hapi-auth-cookie'), function (err) {

  if(err){
    console.error('Auth blowin\' up y\'all');
  }

  server.auth.strategy('session', 'cookie', {
    password: 'lacroix',
    redirectOnTry: false,
  });

  var routes = [
    {
      method: 'GET',
      path: '/',
      config: {
        handler: home,
        auth: 'session'
      }
    }
  ];

  server.route(routes);

  server.route({
    path: '/{path*}',
    method: "GET",
    config: {
      handler: {
        directory: {
          path: './dist',
          listing: false,
          index: false
        }
      },
      auth: 'session'
    }
  });

  server.start(function () {
    var io = SocketIO.listen(server.listener);

    var getUserId = function (fingerprint, ip) {
      return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
    };

    io.on('connection', function (socket) {
      users ++;

      socket.on('disconnect', function () {
        users --;
        if (users < 0) {
          users = 0;
        }

        io.emit('active', users);
      });

      io.emit('active', users);

      services.recent(function (err, chats) {
        chats.forEach(function (chat) {
          setImmediate(function () {
            socket.emit('message', chat.value);
          });
        });
      });

      var ip = socket.handshake.address;

      if (socket.handshake.headers['x-forwarded-for']) {
        ip = socket.handshake.headers['x-forwarded-for'].split(/ *, */)[0];
      }

      socket.emit('ip', ip);

      socket.on('message', function (data) {
        data = JSON.parse(data);
        var userId = getUserId(data.fingerprint, ip);

        if (userId !== getUserId(data.fingerprint, data.ip)) {
          console.log('error, invalid fingerprint');
          return;
        }

        var payload = {
          message: data.message,
          media: data.media,
          fingerprint: userId
        };

        services.addMessage(payload, function (err, chat) {
          if (err) {
            console.log('error ', err);
          } else {
            io.emit('message', chat);
          }
        });
      });
    });
  });
});

function home(request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
}
