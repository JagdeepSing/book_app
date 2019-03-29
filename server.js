'use strict';

// SERVER CONFIGURATION
require('dotenv').config();

const superagent = require('superagent');
const express = require('express');
const app = express();
const pg = require('pg');
const methodOverride = require('method-override');

// Use EJS for embedding JS in html
app.set('view engine', 'ejs');

// create client connection to database
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

const PORT = process.env.PORT;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// LISTEN ON PORT
app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

// -----------------------------------------------------------------

// ROUTES

// get routes (send information out)
app.get('/', getBooksFromDatabase);

app.get('/search', (req, res) => {
  res.render('pages/searches/new');
});

app.get('/books/details/:book_id', (req, res) => {
  // query saved books to display
  let query = `SELECT * FROM books WHERE id=$1;`;
  let values = [req.params.book_id];

  client.query(query, values)
    .then(sqlResult => {
      if (!sqlResult.rowCount) handleError({status: 404}, 'No good, the book went up in smoke', gifs.hiding, res);

      res.render('pages/books/show', {book: sqlResult.rows[0]});
    })
    .catch(error => console.error(error));
});

app.get('/*', (req, res) => {
  handleError({ status: 404 }, 'Nothing here... ¯¯\\_(ツ)_/¯', gifs.moveAlong, res);
});

// post routes (take information in and do things with that information)
app.post('/searches/new', getBookDataFromApi);
app.post('/add', addBook);

// put routes, update information in our database
app.put('/update/:book_id', (req, res) => {
  let {title, author, isbn, image_url, description, bookshelf} = req.body;

  let SQL = `UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7 RETURNING *`;
  let values = [title, author, isbn, image_url, description, bookshelf, req.params.book_id];

  client.query(SQL, values)
    .then(sqlReturn => {
      res.render('pages/books/show', { book: (sqlReturn.rows[0]) });
    })
    .catch(err => handleError(err, `Something went wrong and we couldn't update the book`, gifs.superRare, res));
});

// delete route, remove information from our database
app.delete('/delete/:book_id', deleteBook);

// HELPER FUNCTIONS ------------------------------------------------------

const gifs = {
  moveAlong: 'https://media.giphy.com/media/10RgsuetO4uDkY/giphy.gif',
  superRare: 'https://media.giphy.com/media/1HH6lJOzOXAY/giphy.gif',
  smh: 'https://media.giphy.com/media/kPu4Q1oYpmj3gopFZy/giphy.gif',
  hiding: 'https://media.giphy.com/media/B37cYPCruqwwg/giphy.gif',
  noresponse: 'https://media.giphy.com/media/R55sOeBR22ogg/giphy.gif',
  thereWasTime: 'https://media.giphy.com/media/13ZvdTQADxhvZm/giphy.gif',
};

function handleError(error, errorMessage, errorGif, res) {
  console.error(error);
  if (res) {
    res.render('pages/error', {
      status: error.status,
      message: errorMessage,
      gif: errorGif,
    });
  }
}

function addBook(req, res) {
  let {title, author, isbn, image_url, description, bookshelf} = req.body;

  let SQL = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
  let values = [author, title, isbn, image_url, description, bookshelf];
  
  return client.query(SQL, values)
    .then(sqlReturn => res.render('pages/books/show', {book: sqlReturn.rows[0]}))
    .catch(err => handleError(err, 'Failed to save book.', gifs.hiding, res));
}

function deleteBook(req, res) {
  console.log('deleting book', req.params.book_id);
  let SQL = `DELETE FROM books WHERE id=$1`;
  let values = [req.params.book_id];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => handleError(err, '', gifs.noresponse, res));
}

function getBooksFromDatabase(req, res) {
  let selectSql = `SELECT * FROM books;`;
  client.query(selectSql)
    .then(sqlResult => {
      res.render('pages/index', { sqlResults : sqlResult });
    })
    .catch(error => handleError(error, 'Database hiding :(', gifs.hiding, res));
}

/**
 * Gets book data for passed in request and renders to page
 *
 * @param {object} req express.js request
 * @param {object} res express.js response
 */
function getBookDataFromApi(req, res) {
  const searchTerm = `${req.body.search[1]}:${req.body.search[0]}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=+in${searchTerm}`
  superagent.get(url)
    .then(apiData => {
      if (apiData.body.totalItems === 0) {
        handleError({status: 404}, `You found something Google doesn't know!!`, gifs.superRare, res);
      } else {
        let resultBooks = apiData.body.items.map((bookData) => new Book(bookData.volumeInfo));

        res.render('pages/searches/show', { searchResults: resultBooks });
      }
    })
    .catch(error => handleError(error, `Google won't talk to us :(`, gifs.noresponse, res));
}

// Constructors -----------------------------------------------------------

// Object constructor
function Book(data) {
  this.author = (data.authors) ? data.authors.join(', ') : 'No known author(s)';
  this.title = data.title || 'No Title';
  this.isbn = data.industryIdentifiers ? `${data.industryIdentifiers[0].type}: ${data.industryIdentifiers[0].identifier}` : null;
  this.image_url = (data.imageLinks && data.imageLinks.thumbnail) ? data.imageLinks.thumbnail.replace('http://', 'https://') : 'https://unmpress.com/sites/default/files/default_images/no_image_book.jpg';
  this.description = data.description || 'No description available.';
  this.bookshelf = data.bookshelf || 'Not Shelved';
}
