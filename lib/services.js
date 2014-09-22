'use strict';

var crypto = require('crypto');
var fs = require('fs');
var child = require('child_process');

var uuid = require('uuid');
var Publico = require('meatspace-publico');
var dataURIBuffer = require('data-uri-to-buffer');
var ffmpeg = require('fluent-ffmpeg');

var TMP_DIR = __dirname + '/../tmp/';

var getUserId = function (fingerprint, ip) {
  return crypto.createHash('md5').update(fingerprint + ip).digest('hex');
};

var messages = new Publico('none', {
  db: './db/db-messages',
  limit: 20
});

var convertToWebm = function (mediaArr, next) {
  // write images to tmp files
  var mediaId = uuid.v4();
  var count = 0;
  var ended = false;

  mediaArr.forEach(function (frame) {
    setImmediate(function () {
      var buffer = dataURIBuffer(frame);
      var video = '';

      fs.writeFile(TMP_DIR + mediaId + '-' + count + '.jpeg', buffer, 'utf8', function (err) {
        if (err) {
          next(err);
          return;
        }

        if (count === mediaArr.length - 1) {
          console.log('images done');

          setTimeout(function () {
            console.log('converting webm')
            child.exec('ffmpeg -pattern_type glob -i "' + mediaId + '-*.jpeg" ' +
              TMP_DIR + mediaId + '.webm', function (err, stdout, stderr) {

              if (err) {
                console.error('** ', err)
              }

              var readStream = fs.createReadStream(TMP_DIR + mediaId + '.webm');

              readStream.on('data', function (chunk) {
                console.log(chunk)
                video += chunk;
              });

              readStream.on('error', function (err) {
                console.error('!!! ', err);
                child.exec('rm ' + TMP_DIR + mediaId + '*');
              });

              readStream.on('end', function () {
                console.log(video.length)
                return video;
                child.exec('rm ' + TMP_DIR + mediaId + '*');
              });
            });
          }, 5000);
        }
      });

      count ++;
    });
  });
};

exports.recent = function (request, reply) {

};

exports.addMessage = function (payload, next) {
  convertToWebm(payload.media, next);
};