'use strict';

require('dotenv').config();

// const ejs = require('ejs');
const superagent = require('superagent');
const express = require('express');
const app = express();

const PORT = process.env.PORT;

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');

app.get('/hello', (req, res) => {
  res.send('HELLO WORLD! nothing here yet');
});

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.post('/search', (req, res) => {
  console.log(req.body);
  const url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.search[1]}:${req.body.search[0]}`
  superagent.get(url)
    .then(results => {
      /**
       * selfLink
       * volumeInfo.title
       * volumeInfo.subtile
       * volumeInfo.authors (array)
       * volumeInfo.publisher
       * volumeInfo.description
       * volumeInfo.industryIdentifiers (array) .type and .identifier 
       * volumeInfo.pageCount
       * volumeInfo.categories
       * volumeInfo.maturityRating
       * searchInfo.textSnippet
       */
    })
    .catch();
  // res.send('form submitted');
});

app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

