var $ = require('jquery');
var ReconnectingWebSocket = require('ReconnectingWebSocket');

var ws = new ReconnectingWebSocket('ws://' +
  location.hostname + (location.port ? ':' + location.port : ''));

ws.onopen = function () {
  console.log('Connected');
};

var messages = $('#messages');
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');
var invisible = $('#invisible');
var invisibleMode = $('#invisible-mode');
var form = $('form');

filtered.click(function () {
  messagesFiltered.slideToggle('fast', function () {
    if (filtered.hasClass('on')) {
      filtered.removeClass('on');
    } else {
      filtered.addClass('on');
    }
  });
});

invisible.click(function () {
  if (!invisible.hasClass('on')) {
    invisibleMode.slideDown('fast');
    invisible.addClass('on');
  } else {
    invisibleMode.slideUp('fast');
    invisible.removeClass('on');
  }
});

invisibleMode.on('click', 'button', function () {
  invisibleMode.slideUp('fast');
});

form.submit(function (ev) {
  ev.preventDefault();

  ws.send(JSON.stringify({
    message: $('#comment').val(),
    media: $('#media').val()
  }));
});

ws.onmessage = function (ev) {
  var data = JSON.parse(ev.data);

  var li = $('<li></li>');
  var video = $('<video src="' + data.media + '", autoplay="autoplay", loop></video>');
  var p = $('<p></p>');
  p.html(data.message);
  li.append(video).append(p);
  messages.append(li);
}