const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Imports your Neon connection pool

// 1. STUDENT REGISTRATION ENDPOINT
router.post('/register', async (req, res) => {
  try {
    const { student_number, first_name, last_name, email, password } = req.body;

    // Validation: Check if student already exists
    const userCheck = await db.query('SELECT * FROM users WHERE student_number = $1 OR email = $2', [student_number, email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Student number or email is already registered.' });
    }

    // Securely hash the student's password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save the new student into your Neon PostgreSQL database
    const newUser = await db.query(
      'INSERT INTO users (student_number, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, student_number, email',
      [student_number, first_name, last_name, email, passwordHash]
    );

    res.status(201).json({ message: 'Registration successful!', user: newUser.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error during registration.');
  }
});

// 2. STUDENT LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  try {
    const { student_number, password } = req.body;

    // Check if the student exists in the database
    const userResult = await db.query('SELECT * FROM users WHERE student_number = $1', [student_number]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Student Number or Password.' });
    }

    const user = userResult.rows[0];

    // Verify if the input password matches the stored database hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Student Number or Password.' });
    }

    // Generate a secure JWT session token for the student
    const token = jwt.sign(
      { id: user.id, student_number: user.student_number },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Logs student out automatically after 24 hours
    );

    res.json({
      token,
      user: {
        id: user.id,
        student_number: user.student_number,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error during login.');
  }
});

module.exports = router;
