'use strict';

const express = require('express');
const app = express();

const PORT = process.env.PORT;

app.set('view engine', 'ejs');

app.get('/', homePage);

app.listen(PORT, () => console.log(`Book app listening on ${PORT}`));

