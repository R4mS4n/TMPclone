const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // loads from the same dir as db.js
const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

console.log("Connecting to:", process.env.DB_HOST, process.env.DB_USER); // debug

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database!');
});

module.exports = db;