'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var SocketIO = require('socket.io');

var services = require('./lib/services');

nconf.argv().env().file({ file: 'local.json' });

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

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: home
    }
  }
];

server.route(routes);

server.route({
  path: '/{path*}',
  method: "GET",
  handler: {
    directory: {
      path: './dist',
      listing: false,
      index: false
    }
  }
});

server.start(function () {
  var io = SocketIO.listen(server.listener);

  io.on('connection', function (socket) {
    console.log('user connected');

    socket.on('recent', function () {
      services.recent(function (err, chats) {
        chats.forEach(function (chat) {
          setImmediate(function () {
            io.emit('message', chat.value);
          });
        });
      });
    });

    socket.on('message', function (data) {
      data = JSON.parse(data);

      var payload = {
        message: data.message,
        media: data.media
      };

      services.addMessage(data, function (err, chat) {
        if (err) {
          console.log('error ', err);
        } else {
          io.emit('message', chat);
        }
      });
    });
  });
});

function home(request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
}
