'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var WebSocketServer = require('ws').Server;
var wss;

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
  wss = new WebSocketServer({ server: server.listener });

  wss.on('open', function (ws) {
    console.log('connected to ws');
  });

  wss.on('connection', function (ws) {
    ws.on('message', function (data) {
      data = JSON.parse(data);
      console.log('incoming ', data)
      var payload = {
        message: data.message,
        media: data.media
      };

      services.addMessage(payload);
      ws.send(JSON.stringify(payload));
    });
  });
});

function home(request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
}
