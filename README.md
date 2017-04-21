# raspivid-stream
Raspberry pi cam video, as a stream you can send straight to web clients.

The first request for a stream starts the camera recording and streams from there.

All subsequent calls will be given a stream starting with the initial parameter frames (so
it's renderable, but starting the actual video frames from the current time.

You should be able to pass the output client-side into a renderer like [Broadway.js](https://github.com/mbebenita/Broadway),
or [h264-live-player](https://www.npmjs.com/package/h264-live-player) (broadway + logic + canvas renderer)
and immediately get live streaming video. See [pi-cam](https://github.com/pimterry/pi-cam) for a simple working demo.

## Installation

```
npm install raspivid-stream
```

## Usage

Server-side:

```js
var raspividStream = require('raspivid-stream');

var stream = raspividStream();

// To stream over websockets:
videoStream.on('data', (data) => {
    ws.send(data, { binary: true }, (error) => { if (error) console.error(error); });
});
```

Client-side:

```html
<script type="text/javascript" src="https://rawgit.com/131/h264-live-player/master/vendor/dist/http-live-player.js"></script>
<script>
    var canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    var wsavc = new WSAvcPlayer(canvas, "webgl");

    wsavc.connect(YOUR_WEBSOCKET_URL);
</script>
```