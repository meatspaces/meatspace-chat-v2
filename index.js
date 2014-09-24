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
  },
  {
    method: 'GET',
    path: '/recent',
    config: {
      handler: services.recent
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

    socket.on('message', function (data) {
      data = JSON.parse(data);

      var payload = {
        message: data.message,
        media: data.media
      };

      services.addMessage(data, function (err, media) {
        if (err) {
          console.log('error ', err);
        } else {
          payload.media = media;
          io.emit('message', payload);
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
