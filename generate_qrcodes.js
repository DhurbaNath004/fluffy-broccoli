const mysql = require('mysql2'); // Use mysql2 for better compatibility
const { v4: uuidv4 } = require('uuid');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const TICKET_COUNT = 100;
const VERIFICATION_URL_BASE = 'http://localhost:3000/verify?id=';

// NOTE: This dbConfig is for the data generator script only.
// The API has its own connection.
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '7TUIwjuTVyqj0wJC',
  database: 'verification_db',
};

async function generateDataAndQRCodes() {
  const connection = mysql.createConnection(dbConfig);

  try {
    // Check and create the qrcodes directory if it doesn't exist
    const qrcodesDir = path.join(__dirname, 'qrcodes');
    if (!fs.existsSync(qrcodesDir)) {
      fs.mkdirSync(qrcodesDir);
    }

    console.log('Connecting to MySQL...');
    await connection.promise().connect();
    console.log('Connected to MySQL.');

    const insertPromises = [];
    const users = [];

    // Generate dummy user data
    for (let i = 1; i <= TICKET_COUNT; i++) {
      const id = uuidv4();
      const name = `User ${i}`;
      const email = `user${i}@example.com`;
      users.push({ id, name, email });
    }

    // Insert data into the database
    console.log(`Inserting ${TICKET_COUNT} users into the database...`);
    for (const user of users) {
      const sql = 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)';
      insertPromises.push(connection.promise().query(sql, [user.id, user.name, user.email]));
    }

    await Promise.all(insertPromises);
    console.log('User data inserted successfully.');

    // Generate QR codes for each user
    console.log(`Generating QR codes...`);
    const qrcodePromises = [];
    for (const user of users) {
      const verificationUrl = `${VERIFICATION_URL_BASE}${user.id}`;
      const qrcodePath = path.join(qrcodesDir, `${user.id}.png`);
      qrcodePromises.push(qrcode.toFile(qrcodePath, verificationUrl));
    }

    await Promise.all(qrcodePromises);
    console.log('QR codes generated successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    connection.end();
    console.log('Database connection closed.');
  }
}

generateDataAndQRCodes();
