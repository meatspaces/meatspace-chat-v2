var AnimatedGif = require('animated_gif/src/Animated_GIF.js');
var toBlob = require('data-uri-to-blob');

module.exports = function (videoElem, numFrames, workerPath, cb) {
  var frameDuration = videoElem.duration / numFrames;
  var recordingElem = document.createElement('video');
  // Work around Firefox not considering data URI's "origin-clean" (meaning we can't draw from the
  // data URI video to our canvas and still be able to call getImageData). For some reason, object
  // URI's count as origin-clean.
  var videoBlob = toBlob(videoElem.src);
  var videoUrl = window.URL.createObjectURL(videoBlob);

  var gifCreator = new AnimatedGif({ workerPath: workerPath });
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  gifCreator.setSize(videoElem.videoWidth, videoElem.videoHeight);
  gifCreator.setDelay(frameDuration * 1000);
  canvas.width = videoElem.videoWidth;
  canvas.height = videoElem.videoHeight;
  var frame = 0;

  var cleanup = function() {
    gifCreator.destroy();
    delete recordingElem.src;
    window.URL.revokeObjectURL(videoBlob);
  }

  recordingElem.addEventListener('error', function(err) {
    cleanup();
    cb(err);
  });

  recordingElem.addEventListener('loadeddata', function() {
    recordingElem.pause();
    // seek to the first frame (triggering the seeked callback below)
    recordingElem.currentTime = frame * frameDuration;
  });

  recordingElem.addEventListener('seeked', function() {
    try {
      context.drawImage(recordingElem, 0, 0);
      gifCreator.addFrameImageData(context.getImageData(0, 0, canvas.width, canvas.height));
      frame++;

      if (frame < numFrames) {
        recordingElem.currentTime = frame * frameDuration;
      } else {
        gifCreator.getBlobGIF(function(image) {
          cleanup();
          cb(null, image);
        });
      }
    } catch (err) {
      cleanup();
      cb(err);
    }
  });

  recordingElem.src = videoUrl;
  recordingElem.load();
  // Firefox mobile doesn't like to load videos unless it *really* has to, so we play it to get
  // things started there
  recordingElem.play();
};
