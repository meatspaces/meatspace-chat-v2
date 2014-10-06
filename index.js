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
  config: {
    handler: {
      directory: {
        path: './dist',
        listing: false,
        index: false
      }
    }
  }
});

server.start(function () {
  var io = SocketIO.listen(server.listener);

  var getUserId = function (fingerprint, ip) {
    return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
  };

  var setPayload = function (data, room, ip, io) {
    data = JSON.parse(data);
    var userId = getUserId(data.fingerprint, ip);

    if (userId !== getUserId(data.fingerprint, data.ip)) {
      console.log('error, invalid fingerprint');
      return;
    }

    var payload = {
      message: data.message,
      media: data.media,
      fingerprint: userId,
      videoType: room
    };

    services.addMessage(payload, function (err, chat) {
      if (err) {
        console.log('error ', err);
      } else {
        io.sockets.in(room).emit('message', chat);
      }
    });
  };

  io.on('connection', function (socket) {
    var room = 'webm';

    users ++;

    socket.on('disconnect', function () {
      users --;
      if (users < 0) {
        users = 0;
      }

      io.emit('active', users);
    });

    io.emit('active', users);

    services.recent(socket);

    var ip = socket.handshake.address;

    if (socket.handshake.headers['x-forwarded-for']) {
      ip = socket.handshake.headers['x-forwarded-for'].split(/ *, */)[0];
    }

    socket.emit('ip', ip);

    socket.on('room', function (r) {
      if (r === 'h264') {
        // don't allow hijacking to a random room
        room = r;
      }

      socket.join(room);
    });

    socket.on('message', function (data) {
      setPayload(data, room, ip, io);
    });
  });
});

function home(request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
}
