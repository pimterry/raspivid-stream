const Splitter = require('stream-split');
const stream = require('stream');
const concat = require('concat-stream');
const raspivid = require('raspivid');

const NALseparator = new Buffer([0,0,0,1]);

const headerData = {
    _waitingStream: new stream.PassThrough(),
    _firstFrames: [],
    _lastIdrFrame: null,

    get idrFrame() {
        return this._lastIdrFrame;
    },

    set idrFrame(frame) {
        this._lastIdrFrame = frame;

        const waitingStream = this._waitingStream;
        this._waitingStream = null;
        this.getStream().pipe(waitingStream);
    },

    addParameterFrame: function (frame) {
        this._firstFrames.push(frame)
    },

    getStream: function () {
        if (this._waitingStream) {
            return this._waitingStream;
        } else {
            const stream = new stream.Readable();
            this._firstFrames.forEach((frame) => {
                stream.push(frame);
            });
            stream.push(this._lastIdrFrame);
            return stream;
        }
    }
};

// This returns the live stream only, without the parameter chunks
function getLiveStream() {
    return raspivid({
        width: 960,
        height: 540,
        framerate: 12,
        profile: 'baseline',
        timeout: 0
    })
    .pipe(new Splitter(NALseparator))
    .pipe(new stream.Transform({ transform: function (chunk, encoding, callback) {
        const chunkWithSeparator = Buffer.concat([NALseparator, chunk]);

        const chunkType = chunk[0] & 0b11111;

        // Capture the first SPS & PPS frames, so we can send stream parameters on connect.
        if (chunkType === 7 || chunkType === 8) {
            headerData.addParameterFrame(chunkWithSeparator);
        } else {
            // The live stream only includes the non-parameter chunks
            this.push(Buffer.concat([NALseparator, chunk]));

            // Keep track of the latest IDR chunk, so we can start clients off with a near-current image
            if (chunkType === 5) {
                headerData.idrFrame = Buffer.concat([NALseparator, chunk]);
            }
        }

        callback();
    }}));
}

var liveStream = null;

module.exports = function () {
    if (!stream) {
        liveStream = getLiveStream();
    }

    return headerData.getStream().pipe(concat(liveStream));
}
