$(() => {
  'use strict';

  // menu displays on mouseover of menu icon
  $('#menu-icon').on('mouseover', () => {
    $('#menu').show();
    $('header').on('mouseleave', () => {
      $('#menu').hide();
    });
  });
});
