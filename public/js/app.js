$(() => {
  'use strict';

  $('#menu-icon').on('mouseover', () => {
    $('#menu').show();
    $('header').on('mouseleave', () => {
      $('#menu').hide();
    });
  });
});
