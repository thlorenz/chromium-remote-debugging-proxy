# chromium-remote-debugging-proxy

A proxy that sits in between a chromium devtools frontend and the remote chromium being debugged and logs requests, responses and websocket
messages that are exchanged.

![screenshot](https://raw.githubusercontent.com/thlorenz/chromium-remote-debugging-proxy/master/assets/screenshot.png)

## Usage 

### Start Proxy

```
crdp
```

### Start Chromium with remote debugging enabled

```
./Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222 --no-sandbox
```

### Open DevTools in another Browser

Make sure it points to the Proxy Port (by default `REMOTE_PORT -1`).

[localhost:9221](http://localhost:9221/)

## Installation

    npm install chromium-remote-debugging-proxy

## Configuration

You can override both ports used by setting the below environment variables:

- `REMOTE_PORT`: overrides port at which remote Chromium is listening, same as `--remote-debugging-port` (default:
  `9222`)
- `PORT`: overrides proxy port (default: `REMOTE_PORT - 1`)

## License

MIT
