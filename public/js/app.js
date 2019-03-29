$(() => {
  'use strict';

  // menu displays on mouseover of menu icon
  $('#menu-icon').on('mouseover', () => {
    $('#menu').show();
    $('header').on('mouseleave', () => {
      $('#menu').hide();
    });
  });

  // click out of form to exit form popup
  $('.form-div').on('click', function(event) {
    if (event.target === this) {
      $(this).hide();
    }
  });

  // update button on book details page displays popup form
  $('.update-btn').on('click', function(event) {
    console.log($(event.target).val());
    $($(event.target).val()).show();
  });
});
