# Meatspace Chat v2: Electric Boogaloo

## Info

This is a rewrite of the old meatspace code and there are some notes:

* This will not work with iOS since they do not support webm. File a ticket with them if you care.
* As a result, this will not work with the current iOS app MeatChat.
* This should work in Android within Firefox or Chrome.

## Install ffmpeg

### On OSX:

    brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-opus --with-rtmpdump --with-schroedinger --with-speex --with-theora --with-tools

### On Ubuntu

[https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu](https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu)

Everything else: [https://trac.ffmpeg.org/wiki/CompilationGuide](https://trac.ffmpeg.org/wiki/CompilationGuide)

## Install node and related items

    npm install
    cp local.json-dist local.json
    npm start

## Accessing the API

This is using the latest version of [socket.io](http://socket.io) and will not work with the old version from the previous meatspace API.

To post:

Emit to 'message' - in JavaScript on the clientside it would be like this:

    var socket = io();

    socket.emit('message', JSON.stringify({
        message: 'your chat message',
        media: ['data:image/jpeg;base64,<a base64 blob of the jpeg data>', 'data:image/jpeg;base64,<a base64 blob of the jpeg data>', ...],
        ip: '<ip address of user>',
        fingerprint: '<a unique fingerprint for the device or service>'
    }));

Notes: `media` has to be an array of 10 JPEG data URIs. Ideally they are recorded 200 ms apart for consistency.

To listen to incoming messages:

    socket.on('message', function (data) {
        console.log(data);
    });

## License

BSD
