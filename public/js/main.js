var $ = require('jquery');

var messages = $('#messages');
var messagesFiltered = $('#messages-filtered');
var filtered = $('#filtered');
var unmute = $('#unmute');

filtered.click(function () {
  messagesFiltered.slideToggle('slow', function () {
    if (filtered.hasClass('on')) {
      filtered.removeClass('on');
    } else {
      filtered.addClass('on');
    }
  });
});
