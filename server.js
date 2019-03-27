'use strict';

// SERVER CONFIGURATION
require('dotenv').config();

// const ejs = require('ejs');
const superagent = require('superagent');
const express = require('express');
const app = express();
const pg = require('pg');

// create client connection to database
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

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

app.get('/', getBooksFromDatabase);

app.get('/search', (req, res) => {
  res.render('pages/searches/new');
})
app.post('/searches/new', getBookDataFromApi);

// HELPER FUNCTIONS

function handleError(error, errorMessage, res) {
  // console.error(error);
  if (res) {
    res.render('pages/error', {
      status: error.status,
      message: errorMessage,
    });
  }
}

function getBooksFromDatabase(req, res) {
  let selectSql = `SELECT * FROM books;`;
  client.query(selectSql)
    .then(sqlResult => {
      // res.send('hello');
      if (!sqlResult.rowCount) handleError({ status: 404 }, 'Fire at Alexandrea!! The knowledge has been lost, the SQL data has been dropped!', res);
      res.render('pages/index', { sqlResults : sqlResult });
    })
    .catch(error => handleError(error, 'Database hiding :('));
}

/**
 * Gets book data for passed in request and renders to page
 *
 * @param {object} req express.js request
 * @param {object} res express.js response
 */
function getBookDataFromApi(req, res) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=+in${req.body.search[1]}:${req.body.search[0]}`
  superagent.get(url)
    .then(apiData => {
      if (apiData.body.totalItems === 0) {
        handleError({status: 404}, `You found something Google doesn't know!!`, res);
      } else {
        let resultBooks = apiData.body.items.map((bookData) => {
          let bookObject = new Book(bookData.volumeInfo);

          let insertSql = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
          let insertValues = Object.values(bookObject);

          client.query(insertSql, insertValues)
            .then(insertReturn => {
              bookObject.id = insertReturn.rows[0].id;
            })
            .catch(error => handleError(error, `Google gave us some ugly data :(`, res));

          return bookObject;
        });
        res.render('pages/searches/show', { searchResults: resultBooks });
      }
    })
    .catch(error => handleError(error, `Google won't talk to us :(`, res));
}

// Object constructor
function Book(data, bookshelf) {
  this.author = (data.authors) ? data.authors.join(', ') : 'No known author(s)';
  this.title = data.title || 'No Title';
  this.isbn = data.industryIdentifiers ? `${data.industryIdentifiers[0].type} ${data.industryIdentifiers[0].identifier}` : 'N/A';
  this.image_url = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail.replace('http://', 'https://') : 'https://unmpress.com/sites/default/files/default_images/no_image_book.jpg';
  this.description = data.description || 'No description available.';
  this.bookshelf = bookshelf || 'Not Shelfed';


  // this.subtitle = data.subtitle || 'No Subtitle';
  // this.publisher = data.publisher || 'No publisher info';
  // this.pageCount = data.pageCount || -1;
  // this.categories = (data.categories) ? data.categories.join(', ') : '';
  // this.maturityRating = data.maturityRating || 'No Rating';
  // this.created_at = Date.now();
}
