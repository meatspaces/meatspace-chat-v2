var $ = require('jquery');
var Webrtc2images = require('webrtc2images');
var Fingerprint = require('fingerprintjs');
var music = require('./music');
var services = require('./services');
var vid2gif = require('vid2gif');
var UserIdManager = require('./user-id-manager');
var socket = io();

var rtc = false;
var webmSupport = false;
var rtcInitialized = false;

var CHAR_LIMIT = 250;
var NUM_FRAMES = 10;
var GIF_WORKER_PATH = 'gif-worker.js';

rtc = new Webrtc2images({
  width: 200,
  height: 150,
  frames: NUM_FRAMES,
  type: 'image/jpeg',
  quality: 0.8,
  interval: 200
});

var profile = {
  fingerprint: new Fingerprint({ canvas: true }).get()
};

var testVideo = $('<video></video>')[0];

if (testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')) {
  webmSupport = true;
}

var messages = $('#messages');
var message = $('#composer-message');
var body = $('body');
var doc = $(document);
var unmute = $('#unmute');
var counter = $('#counter');
var form = $('form');
var sadBrowser = $('#sad-browser');
var active = $('#active');
var info = $('#info');
var infoScreen = $('#info-screen');
var mutedFP = JSON.parse(localStorage.getItem('muted')) || {};
var userIdManager = new UserIdManager();

window.addEventListener('storage', function() {
  mutedFP = JSON.parse(localStorage.getItem('muted')) || {};
  userIdManager.reload();
});

counter.text(CHAR_LIMIT);

rtc.startVideo(function (err) {
  rtcInitialized = true;
  if (err) {
    rtc = false;
  }

  if (!rtc || !webmSupport) {
    sadBrowser.show();
    form.remove();
    $('#video-preview').remove();
  }
});

$('#music').click(music.toggle);

$('.close').click(function () {
  infoScreen.removeClass('on');
});

unmute.click(function (ev) {
  mutedFP = {};
  localStorage.setItem('muted', JSON.stringify(mutedFP));
});

var submitting = false;

message.on('keyup', function (ev) {
  var count = CHAR_LIMIT - message.val().length;

  if (count < 0) {
    count = 0;
  }

  counter.text(count);
});

form.submit(function (ev) {
  ev.preventDefault();
  if (!rtcInitialized) {
    return; // no submitting without dealing with the allow/deny prompt!
  }
  message.prop('disabled', true);

  if (rtc && !submitting) {
    submitting = true;
    services.sendMessage(profile, rtc, function (err) {
      submitting = false;
      message.prop('disabled', false);
      message.focus();
      counter.text(CHAR_LIMIT);
    });
  }
});

info.click(function () {
  if (infoScreen.hasClass('on')) {
    infoScreen.removeClass('on');
  } else {
    infoScreen.addClass('on');
  }
});

messages.on('click', '.mute', function (ev) {
  ev.preventDefault();
  var fp = $(this).closest('li').data('fp');

  mutedFP[fp] = true;
  localStorage.setItem('muted', JSON.stringify(mutedFP));
  body.find('li[data-fp="' + fp + '"]').remove();
});

messages.on('click', '.convert', function (ev) {
  var button = $(this);
  if (button.is('.progress') || button.is('.save')) {
    return;
  }

  button.removeClass('error').addClass('progress');
  button.text('Converting...');
  var video = button.closest('.video-container').find('video')[0];
  vid2gif(video, NUM_FRAMES, function(err, gifBlob) {
    button.removeClass('progress');
    if (err) {
      console.error('Error creating GIF:');
      console.dir(err);
      button.addClass('error').text('Error');
      return;
    }

    button.addClass('save').text('Save as GIF');
    var url = window.URL.createObjectURL(gifBlob);
    button.attr('href', url);
    button.attr('download', Date.now() + '.gif');

    var virtualClick = document.createEvent('MouseEvents');
    virtualClick.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
      false, false, false, false, 0, null);
    button[0].dispatchEvent(virtualClick);
  });
});

doc.on('visibilitychange', function (ev) {
  var hidden = document.hidden;
  $('.in-view video').each(function () {
    if (hidden) {
      this.pause();
    } else {
      this.play();
    }
  });
});

socket.on('active', function (data) {
  active.text(data);
});

socket.on('message', function (data) {
  services.getMessage(data, mutedFP, userIdManager, profile, messages);
});

socket.on('messageack', function(err, result) {
  if (err) {
    return;
  }

  userIdManager.add(result.userId);
});

socket.on('connect', function () {
  socket.emit('join', 'webm');
});
