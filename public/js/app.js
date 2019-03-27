'use strict';

$(() => {
  $('.details_link').on('click', function(event) {
    event.preventDefault();
    $(this).toggle();
    $(this).next().toggle();
  });
});
