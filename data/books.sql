DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255) UNIQUE,
  image_url VARCHAR(512),
  description TEXT,
  bookshelf VARCHAR(255),
);

INSERT INTO books
  (author, title, isbn, image_url, description, bookshelf)
  VALUES
  ('L. E. Modesitt, Jr.', 'Gravity Dreams', 'ISBN_10 1429995424', 'http://books.google.com/books/content?id=OYMNVrRJ28oC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'No Description', 'Fiction');

INSERT INTO books
  (author, title, isbn, image_url, description, bookshelf)
  VALUES
  ('Richard Dawkins', 'The Selfish Gene', 'ISBN_10 0192860925', 'http://books.google.com/books/content?id=WkHO9HI7koEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'An ethologist shows man to be a gene machine whose world is one of savage competition and deceit', 'Evolution');
