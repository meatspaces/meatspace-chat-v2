# Meatspace Chat v2: Electric Boogaloo

[![Dependency Status](https://david-dm.org/meatspaces/meatspace-chat-v2.svg)](https://david-dm.org/meatspaces/meatspace-chat-v2) [![devDependency Status](https://david-dm.org/meatspaces/meatspace-chat-v2/dev-status.svg)](https://david-dm.org/meatspaces/meatspace-chat-v2#info=devDependencies)

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

    socket.emit('message', {
        message: 'your chat message',
        media: ['data:image/jpeg;base64,<a base64 blob of the jpeg data>', 'data:image/jpeg;base64,<a base64 blob of the jpeg data>', ...],
        ip: '<ip address of user>',
        fingerprint: '<a unique fingerprint for the device or service>',
        videoType: 'webm'
    });

Notes: 

- `media` has to be an array of 10 JPEG data URIs. Ideally they are recorded 200 ms apart for consistency. Image snapshots must be 200x150 in dimension when sent to the server. If you build a mobile app, you can just scale down the view in the interface but please do not send any other sizes or it won't look good.

- `videoType` defaults to 'webm' but you can request 'mp4' to have that sent instead. This is useful if you want to build an iOS client.

To listen to incoming messages:

    socket.on('message', function (data) {
        console.dir(data);
    });

## Contribution Guidelines

Read our [Contributors' Guide](https://github.com/meatspaces/meatspace-chat-v2/blob/master/CONTRIBUTING.md)
for details.

## License

BSD
