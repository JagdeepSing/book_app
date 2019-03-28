'use strict';

// SERVER CONFIGURATION
require('dotenv').config();

// const ejs = require('ejs');
const superagent = require('superagent');
const express = require('express');
const app = express();
const pg = require('pg');
const methodOverride = require('method-override');

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


app.set('view engine', 'ejs');

// LISTEN ON PORT
app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

const gifs = {
  moveAlong: 'https://media.giphy.com/media/10RgsuetO4uDkY/giphy.gif',
  superRare: 'https://media.giphy.com/media/1HH6lJOzOXAY/giphy.gif',
  smh: 'https://media.giphy.com/media/kPu4Q1oYpmj3gopFZy/giphy.gif',
  hiding: 'https://media.giphy.com/media/B37cYPCruqwwg/giphy.gif',
  noresponse: 'https://media.giphy.com/media/R55sOeBR22ogg/giphy.gif',
  thereWasTime: 'https://media.giphy.com/media/13ZvdTQADxhvZm/giphy.gif',
};


// ROUTES

// get routes
app.get('/', getBooksFromDatabase);

app.get('/search', (req, res) => {
  res.render('pages/searches/new');
});

// TODO: make it work
app.get('/:book_table/details/:book_id', (req, res) => {
  // query saved books to display
  let query = `SELECT * FROM ${req.params.book_table} WHERE id=$1;`;
  let values = [req.params.book_id];

  client.query(query, values)
    .then(sqlResult => {
      if (!sqlResult.rowCount) handleError({status: 404}, 'No good, the book went up in smoke', gifs.hiding, res);

      res.render('pages/books/detail', {book: sqlResult.rows[0]});
    })
    .catch(error => console.error(error));
});

app.get('/:book_table/edit/:book_id', (req, res) => {
  getSqlByID(req.params.book_table, req.params.book_id, res)
    .then(bookObj => {
      // console.log(bookObj.rows[0]);
      res.render('pages/books/edit', {book: bookObj.rows[0]});
    })
    .catch(error => console.error(error));
});

app.put('/:book_table/update/:book_id', (req, res) => {
  console.log(req.body);
});

app.get('/*', (req, res) => {
  handleError({ status: 404 }, 'Nothing here... ¯¯\\_(ツ)_/¯', gifs.moveAlong, res);
});

// post routes
app.post('/searches/new', getBookDataFromApi);



// HELPER FUNCTIONS

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

function getSqlByID(table, id, res) {
  let query = `SELECT * FROM ${table} WHERE id=$1;`;
  let values = [id];

  try {
    return client.query(query, values);
  }
  catch (error) {
    handleError({status: 404}, 'Data invalid or not found', gifs.smh, res);
  }
}

function getBooksFromDatabase(req, res) {
  let selectSql = `SELECT * FROM books;`;
  client.query(selectSql)
    .then(sqlResult => {
      if (!sqlResult.rowCount) handleError({ status: 404 }, 'Fire at Alexandrea!! The knowledge has been lost, the SQL data has been dropped!', gifs.thereWasTime, res);
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
  const url = `https://www.googleapis.com/books/v1/volumes?q=+in${req.body.search[1]}:${req.body.search[0]}`
  superagent.get(url)
    .then(apiData => {
      if (apiData.body.totalItems === 0) {
        handleError({status: 404}, `You found something Google doesn't know!!`, gifs.superRare, res);
      } else {
        let resultBooks = apiData.body.items.map((bookData) => {
          let bookObject = new Book(bookData.volumeInfo);

          let insertSql = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`;
          let insertValues = Object.values(bookObject);

          // client.query(insertSql, insertValues)
          //   .then(insertReturn => {
          //     console.log('----------------------------------------------------------------');
          //     console.log(insertReturn);
          //     bookObject.id = insertReturn.rows[0].id;
          //   })
          //   .catch(error => {
          //     if (error.code === 23505) {
          //       console.log('-------------------- duplicate insert ------------------------');
          //     }
          //     console.error(error);
          //     // handleError(error, `Google gave us some ugly data :(`, gifs.smh, res);
          //   });

          return bookObject;
        });
        res.render('pages/searches/show', { searchResults: resultBooks });
      }
    })
    .catch(error => handleError(error, `Google won't talk to us :(`, gifs.noresponse, res));
}

// Object constructor
function Book(data, bookshelf) {
  this.author = (data.authors) ? data.authors.join(', ') : 'No known author(s)';
  this.title = data.title || 'No Title';
  this.isbn = data.industryIdentifiers ? `${data.industryIdentifiers[0].type}: ${data.industryIdentifiers[0].identifier}` : null;
  this.image_url = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail.replace('http://', 'https://') : 'https://unmpress.com/sites/default/files/default_images/no_image_book.jpg';
  this.description = data.description || 'No description available.';
  this.bookshelf = bookshelf || 'Not Shelved';
}
