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
  res.send('HELLO WORLD!');
});

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

