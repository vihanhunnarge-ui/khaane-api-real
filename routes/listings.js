const express = require('express');
const { executeQuery } = require('../database/postgres');

const router = express.Router();

// Helper to transform snake_case DB row to camelCase
const transformListing = (row) => ({
  id: row.id,
  sellerId: row.seller_id,
  sellerName: row.seller_name,
  sellerApartment: row.seller_apartment,
  name: row.name,
  category: row.category,
  description: row.description,
  price: row.price,
  quantity: row.quantity,
  prepTime: row.prep_time,
  rating: row.rating,
  image: row.image,
  dietaryType: row.dietary_type,
  orderTimeStart: row.order_time_start,
  orderTimeEnd: row.order_time_end,
  deliveryTimeStart: row.delivery_time_start,
  deliveryTimeEnd: row.delivery_time_end,
  allergens: row.allergens,
  isAvailable: row.is_available,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// POST /api/listings - Create new food listing
router.post('/', async (req, res) => {
  try {
    const {
      sellerId, sellerName, sellerApartment, name, category,
      description, price, quantity, prepTime, image, dietaryType,
      orderTimeStart, orderTimeEnd, deliveryTimeStart, deliveryTimeEnd, allergens
    } = req.body;

    if (!name || !price || !quantity || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, quantity, sellerId'
      });
    }

    const result = await executeQuery(
      `INSERT INTO food_listings (
        seller_id, seller_name, seller_apartment, name, category,
        description, price, quantity, prep_time, image, dietary_type,
        order_time_start, order_time_end, delivery_time_start, delivery_time_end,
        allergens, is_available, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *`,
      [
        sellerId, sellerName || '', sellerApartment || '', name, category || 'lunch',
        description || '', parseFloat(price), parseInt(quantity), prepTime || 30,
        image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        dietaryType || 'veg', orderTimeStart || '', orderTimeEnd || '',
        deliveryTimeStart || '', deliveryTimeEnd || '',
        JSON.stringify(allergens || {}), true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Food listing created successfully',
      data: transformListing(result[0])
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// GET /api/listings - Get all listings
router.get('/', async (req, res) => {
  try {
    const { apartment, category, sellerId, available } = req.query;
    
    let query = 'SELECT * FROM food_listings WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    if (apartment) {
      paramCount++;
      query += ` AND seller_apartment = $${paramCount}`;
      params.push(apartment);
    }
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    if (sellerId) {
      paramCount++;
      query += ` AND seller_id = $${paramCount}`;
      params.push(sellerId);
    }
    if (available === 'true') {
      query += ' AND is_available = true';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const listings = await executeQuery(query, params);
    
    // Transform snake_case to camelCase for frontend
    const transformedListings = listings.map(transformListing);
    
    res.json({ success: true, count: transformedListings.length, data: transformedListings });

  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// GET /api/listings/:id - Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listings = await executeQuery(
      'SELECT * FROM food_listings WHERE id = $1',
      [req.params.id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, data: listings[0] });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// PUT /api/listings/:id - Update listing
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date() };
    delete updates.id; delete updates.created_at;
    
    const fields = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updates)) {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
    
    paramCount++;
    values.push(req.params.id);
    
    const result = await executeQuery(
      `UPDATE food_listings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, message: 'Listing updated successfully', data: result[0] });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// DELETE /api/listings/:id - Delete listing
router.delete('/:id', async (req, res) => {
  try {
    const result = await executeQuery(
      'DELETE FROM food_listings WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, message: 'Listing deleted successfully' });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
