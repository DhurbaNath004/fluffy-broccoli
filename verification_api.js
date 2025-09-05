const express = require('express');
const mysql = require('mysql2'); // Use mysql2 for better compatibility
const cors = require('cors');

const app = express();
const port = 3000;

// Update these with your MySQL credentials
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '7TUIwjuTVyqj0wJC', 
  database: 'verification_db'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

app.use(cors());

// A simple endpoint to check if the server is running
app.get('/', (req, res) => {
  res.send('Verification API is running!');
});

// The main verification endpoint
app.get('/verify', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Ticket ID is required.' });
  }

  const sql = 'SELECT id, name, email FROM users WHERE id = ?';
  connection.query(sql, [id], (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (results.length > 0) {
      // User found, return their details
      const user = results[0];
      res.json({
        isAuthentic: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      // User not found
      res.json({ isAuthentic: false });
    }
  });
});

app.listen(port, () => {
  console.log(`Verification API listening at http://localhost:${port}`);
});
// To run this server:
// 1. Make sure you have Node.js installed.
// 2. Open your terminal in this directory and run: npm install express mysql2 cors