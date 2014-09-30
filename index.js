#!/usr/bin/env node

'use strict';

var http      = require('http')
  , httpProxy = require('http-proxy')
  , Hybi      = require('websocket-driver/lib/websocket/driver/hybi')
  , hybi      = new Hybi()
  , retHybi   = new Hybi()
  , traverse  = require('traverse')
  , log       = require('npmlog')

var REMOTE_PORT = process.env.REMOTE_PORT || 9222
  , PORT        = process.env.PORT        || (REMOTE_PORT - 1)
  , HOST        = 'http://127.0.0.1'
  , WS_HOST     = 'ws://127.0.0.1'

function inspect(obj, depth) {
  return require('util').inspect(obj, false, depth || 5, true);
}

function ensureLength(obj) {
  // prevent huge things like sourcemaps to print in their entirety
  traverse(obj).forEach(function (x) {
    if (x && x.length && x.length > 500)
      this.update(x.slice(0, 500) + ' ... ');
  })
}

var proxy = httpProxy.createProxyServer({
    target: WS_HOST + ':' + REMOTE_PORT
  , ws: true  
})

// responses coming from debugged target
proxy.on('proxyRes', function (proxyRes, req, res) {
  log.http(req.method, ' <=', inspect(proxyRes.headers));
})

// messages coming across websocket from debugged target
retHybi.on('message', function onhybiRetMessage(msg) {
  var obj;
  if (msg.data !== null) {
    try {
      obj = JSON.parse(msg.data);
    } catch (err) {
      return log.info('ws', '<=', inspect(msg.data));
    }
    ensureLength(obj)

    log.info('ws', '<=', inspect(obj));
  }
})

proxy.on('proxySocket', function (proxySocket) {
  proxySocket.on('data', function ondata(data) {
    retHybi.parse(data)
  })
})

var server = http.createServer();

// requests sent to debugged target
server.on('request', function onconnection(req, res) {
  log.http(req.method, ' =>', req.url);
  proxy.web(req, res, { target: HOST + ':' + REMOTE_PORT });
  proxy.on('error', function onproxyError(err) {
    log.error('proxy', err);
    if (err.code === 'ECONNREFUSED') log.error('proxy', 'Make sure you have a Chromium instance with remote debugging enabled running.');
  })
})

// messages sent to debugged target across websocket
server.on('upgrade', function onupgrade(req, socket, head) {
  log.info('ws', ' =>', 'Upgrade: %s', req.url);
  var prevId = -1;

  hybi.on('message', function onhybiMessage(msg) {
    var obj;
    if (msg.data !== null) {
      try {
        obj = JSON.parse(msg.data);
      } catch (err) {
        return log.info('ws', '=>', inspect(msg.data));
      }
      if (prevId !== obj.id) { 
        ensureLength(obj)
        log.info('ws', '=>', inspect(obj));
      }
      prevId = obj.id;
    }
  })

  socket.on('data', function ondata(data) {
    hybi.parse(data)
  })

  proxy.ws(req, socket, head);  
})

server.on('listening', function onlisten() {
  log.info('server', '%s:%d', HOST, PORT);
})

server.listen(PORT)
