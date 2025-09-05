// To run this file, you need to install the 'express', 'mysql2', and 'uuid' packages.
// Run this command in the terminal: npm install express mysql2 uuid @prisma/client dotenv

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3000;
const prisma = new PrismaClient();

// ----- Database Config -----
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// ----- Ticket Generation API Endpoint -----
// Method: POST
// Route: /api/generate-tickets
app.post('/api/generate-tickets', async (req, res) => {
    let connection;
    try {
        const ticketHolders = req.body.ticketHolders;
        if (!ticketHolders || ticketHolders.length === 0) {
            return res.status(400).json({ error: 'No ticket holders provided.' });
        }

        connection = await mysql.createConnection(dbConfig);
        const tickets = [];

        for (const holder of ticketHolders) {
            const ticketId = uuidv4();
            // Use Prisma to insert user
            await prisma.users.create({
                data: {
                    id: ticketId,
                    name: holder.name,
                    email: holder.email,
                    phone: holder.phone
                }
            });

            tickets.push({
                id: ticketId,
                name: holder.name,
                email: holder.email,
                phone: holder.phone
            });
        }
        
        res.status(200).json({
            message: 'Tickets generated successfully.',
            tickets: tickets
        });

    } catch (error) {
        console.error('Error during ticket generation:', error);
        res.status(500).json({ error: 'An internal server error occurred during ticket generation.' });
    } finally {
        if (connection) connection.end();
    }
});

// ----- Ticket Verification API Endpoin -----
// Method: GET
// Route: /api/verify/:id
app.get('/api/verify/:id', async (req, res) => {
    const { id } = req.params;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT id, name, email, phone FROM users WHERE id = ?',
            [id]
        );

        if (rows.length > 0) {
            // authentic status true
            res.status(200).json({
                authentic: true,
                data: rows[0]
            });
        } else {
            // authentic status false
            res.status(404).json({
                authentic: false,
                message: 'Ticket not found.'
            });
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({
                authentic: false,
                message: 'An internal server error occurred.'
            });
    } finally {
        if (connection) connection.end();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Verification API listening at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/admin.html to generate tickets`);
    console.log(`Open http://localhost:${port}/index.html to verify a ticket`);
});
