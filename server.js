'use strict';

// SERVER CONFIGURATION
require('dotenv').config();

// const ejs = require('ejs');
const superagent = require('superagent');
const express = require('express');
const app = express();

const PORT = process.env.PORT;

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');

// LISTEN ON PORT
app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

// ROUTES
app.get('/hello', (req, res) => {
  res.send('HELLO WORLD! nothing here yet');
});

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.post('/searches', getBookDataFromApi);

// HELPER FUNCTIONS

/**
 * Gets book data for passed in request and renders to page
 *
 * @param {object} req express.js request
 * @param {object} res express.js response
 */
function getBookDataFromApi(req, res) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search[1]}:${req.body.search[0]}`
  superagent.get(url)
    .then(results => {
      if (results.body.totalItems === 0) {
        handleError({status: 404}, res);
      } else {
        let bookArray = results.body.items.map((bookData) => {
          let book = new Book(bookData.volumeInfo);
          // TODO: Insert data into db
          return book;
        });
        // console.log(bookArray);
        res.render('pages/searches/show', { searchResults: bookArray });
      }
    })
    .catch(error => handleError(error, res));
  // res.send('form submitted');
}

// Object constructor
function Book(data) {
  this.title = data.title || '';
  this.subtitle = data.subtitle || '';
  this.authors = (data.authors) ? data.authors.join(', ') : 'No known author(s)';
  this.publisher = data.publisher || 'No publisher info';
  this.description = data.description || 'No description available.';
  this.isbn = data.industryIdentifiers[0].identifier || 'N/A';
  this.pageCount = data.pageCount || -1;
  this.categories = (data.categories) ? data.categories.join(', ') : '';
  this.maturityRating = data.maturityRating || '';
  this.image = data.imageLinks.thumbnail.replace('http://', 'https://') || 'https://unmpress.com/sites/default/files/default_images/no_image_book.jpg';
  this.created_at = Date.now();
}

function handleError(error, res) {
  // console.error(error);
  // console.log(res);
  if (res) {
    res.render('pages/error', {
      status: error.status,
      message: 'An error has occurred, please retry.'
    });
  }
}
