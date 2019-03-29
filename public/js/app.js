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
  $('.update-btn').on('click', (event) => $($(event.target).val()).show());

  // select button on search page displays popup form
  $('.select-btn').on('click', (event) => $(event.target).next().show());
});
