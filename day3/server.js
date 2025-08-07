const express = require('express');
const app = express();
const PORT = 3000;


app.use(express.json());


let books = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    genre: "Classic Literature",
    isbn: "978-0-7432-7356-5",
    available: true
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    genre: "Fiction",
    isbn: "978-0-06-112008-4",
    available: true
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "Dystopian Fiction",
    isbn: "978-0-452-28423-4",
    available: false
  }
];

let nextId = 4;


const findBookById = (id) => {
  return books.find(book => book.id === parseInt(id));
};


const validateBook = (book) => {
  const errors = [];
  
  if (!book.title || book.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!book.author || book.author.trim() === '') {
    errors.push('Author is required');
  }
  
  if (book.year && (isNaN(book.year) || book.year < 1000 || book.year > new Date().getFullYear())) {
    errors.push('Year must be a valid year between 1000 and current year');
  }
  
  return errors;
};

app.get('/books', (req, res) => {
  try {
    let filteredBooks = [...books];
    

    if (req.query.author) {
      filteredBooks = filteredBooks.filter(book => 
        book.author.toLowerCase().includes(req.query.author.toLowerCase())
      );
    }
    
    // Filter by genre
    if (req.query.genre) {
      filteredBooks = filteredBooks.filter(book => 
        book.genre && book.genre.toLowerCase().includes(req.query.genre.toLowerCase())
      );
    }
    
  
    if (req.query.available !== undefined) {
      const isAvailable = req.query.available.toLowerCase() === 'true';
      filteredBooks = filteredBooks.filter(book => book.available === isAvailable);
    }
    

    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm)
      );
    }
    
    res.status(200).json({
      success: true,
      count: filteredBooks.length,
      data: filteredBooks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.get('/books/:id', (req, res) => {
  try {
    const book = findBookById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.post('/books', (req, res) => {
  try {
    const { title, author, year, genre, isbn, available = true } = req.body;
    
   
    const errors = validateBook(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
 
    if (isbn && books.some(book => book.isbn === isbn)) {
      return res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }
    
    const newBook = {
      id: nextId++,
      title: title.trim(),
      author: author.trim(),
      year: year ? parseInt(year) : undefined,
      genre: genre ? genre.trim() : undefined,
      isbn: isbn ? isbn.trim() : undefined,
      available: Boolean(available)
    };
    
    books.push(newBook);
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.put('/books/:id', (req, res) => {
  try {
    const book = findBookById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${req.params.id} not found`
      });
    }
    
    
    const errors = validateBook(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    
    if (req.body.isbn && req.body.isbn !== book.isbn) {
      if (books.some(b => b.isbn === req.body.isbn && b.id !== book.id)) {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists'
        });
      }
    }
    
    
    const { title, author, year, genre, isbn, available } = req.body;
    
    book.title = title ? title.trim() : book.title;
    book.author = author ? author.trim() : book.author;
    book.year = year !== undefined ? parseInt(year) : book.year;
    book.genre = genre !== undefined ? (genre ? genre.trim() : undefined) : book.genre;
    book.isbn = isbn !== undefined ? (isbn ? isbn.trim() : undefined) : book.isbn;
    book.available = available !== undefined ? Boolean(available) : book.available;
    
    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.delete('/books/:id', (req, res) => {
  try {
    const bookIndex = books.findIndex(book => book.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${req.params.id} not found`
      });
    }
    
    const deletedBook = books.splice(bookIndex, 1)[0];
    
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: deletedBook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/books/stats', (req, res) => {
  try {
    const stats = {
      totalBooks: books.length,
      availableBooks: books.filter(book => book.available).length,
      unavailableBooks: books.filter(book => !book.available).length,
      genreDistribution: {}
    };
    
    
    books.forEach(book => {
      if (book.genre) {
        stats.genreDistribution[book.genre] = (stats.genreDistribution[book.genre] || 0) + 1;
      }
    });
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Book Management API! 📚',
    version: '1.0.0',
    endpoints: {
      'GET /books': 'Get all books (supports filtering)',
      'GET /books/:id': 'Get a specific book by ID',
      'POST /books': 'Add a new book',
      'PUT /books/:id': 'Update a book by ID',
      'DELETE /books/:id': 'Delete a book by ID',
      'GET /books/stats': 'Get book statistics'
    },
    queryParameters: {
      'author': 'Filter by author name',
      'genre': 'Filter by genre',
      'available': 'Filter by availability (true/false)',
      'search': 'Search in title and author'
    }
  });
});

app.use('/*splat', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Visit / for available endpoints.'
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Book Management API is running on http://localhost:${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} to see available endpoints`);
});

