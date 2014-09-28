#!/usr/bin/env node

'use strict';

var http      = require('http')
  , httpProxy = require('http-proxy')
  , Hybi      = require('websocket-driver/lib/websocket/driver/hybi')
  , hybi      = new Hybi()
  , log       = require('npmlog')

var REMOTE_PORT = process.env.REMOTE_PORT || 9222
  , PORT        = process.env.PORT        || (REMOTE_PORT - 1)
  , HOST        = 'http://127.0.0.1'
  , WS_HOST     = 'ws://127.0.0.1'

function inspect(obj, depth) {
  return require('util').inspect(obj, false, depth || 5, true);
}

var proxy = httpProxy.createProxyServer({
    target: WS_HOST + ':' + REMOTE_PORT
  , ws: true  
})

var server = http.createServer();

server.on('request', function onconnection(req, res) {
  log.http(req.method, req.url);
  proxy.web(req, res, { target: HOST + ':' + REMOTE_PORT });
  proxy.on('error', function onproxyError(err) {
    log.error('proxy', err);
    if (err.code === 'ECONNREFUSED') log.error('proxy', 'Make sure you have a Chromium instance with remote debugging enabled running.');
  })
})

server.on('upgrade', function onupgrade(req, socket, head) {
  log.info('ws', 'Upgrade: %s', req.url);
  var prevId = -1;

  hybi.on('message', function onhybiMessage(msg) {
    var obj;
    if (msg.content !== null) {
      try {
        obj = JSON.parse(msg.data);
      } catch (err) {
        return log.info('ws', inspect(msg.data));
      }
      if (prevId !== obj.id) { 
        // prevent huge things like sourcemaps to print in their entirety
        if (obj.params && obj.params.url && obj.params.url.length > 1000) {
          obj.params.url = obj.params.url.slice(0, 1000) + ' ... ';
        }
        log.info('ws', inspect(obj));
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
