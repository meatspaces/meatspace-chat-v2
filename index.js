'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var WebSocket = require('ws');
var ws;

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
    method: 'POST',
    path: '/message',
    config: {
      handler: add
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

server.pack.register({
  plugin: require('crumb')
}, function (err) {
  if (err) {
    throw err;
  }
});

server.start(function () {
  ws = new WebSocket.Server({ server: server.listener });

  ws.on('connection', function (socket) {
    socket.on('message', function (message) {
      subscribers[message] = subscribers[message] || [];
      subscribers[message].push(socket);
    });
  });
});

function home(request, reply) {
  reply.view('index', {
    analytics: nconf.get('analytics')
  });
}

function recent(request, reply) {
  reply({
    messages: messages
  });
}

function add(request, reply) {
  try {
    ws.send(result.content.data);
  } catch (err) {
    ws = new WebSocket.Server({
      server: server.listener
    });

    ws.on('open', function (ws) {
      console.log('opened');
    });

    setTimeout(function () {
      ws.send(result.content.data);
    }, 1000);
  }
}
