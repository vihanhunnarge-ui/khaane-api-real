const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../database/postgres');

const router = express.Router();

// POST /signup - Create a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, apartment_name, flat_number, wing_or_tower } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, password'
      });
    }

    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT * FROM users WHERE phone = $1 OR email = $2',
      [phone, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO users (name, email, phone, password, apartment_name, flat_number, wing_or_tower, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id, name, email, phone, apartment_name, flat_number, wing_or_tower, created_at',
      [name, email, phone, hashedPassword, apartment_name || null, flat_number || null, wing_or_tower || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /users - Get all users (for testing)
router.get('/users', async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, name, email, phone, apartment_name, flat_number, wing_or_tower, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /apartments - Get apartment names for autocomplete
router.get('/apartments', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    
    const { search } = req.query;
    
    let query = 'SELECT DISTINCT apartment_name FROM users WHERE apartment_name IS NOT NULL';
    let params = [];
    
    if (search) {
      query += ' AND apartment_name ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' LIMIT 10';
    
    const apartments = await executeQuery(query, params);
    
    const result = apartments.map(a => ({ name: a.apartment_name, address: '' }));

    res.json({
      success: true,
      message: 'Apartments retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('Get apartments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
