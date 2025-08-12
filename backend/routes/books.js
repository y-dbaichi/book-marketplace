const express = require('express');
const Book = require('../models/Book');
const User = require('../models/User');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { 
      subject, 
      condition, 
      minPrice, 
      maxPrice, 
      search,
      lat,
      lng,
      radius = 50,
      inStock = true
    } = req.query;

    let query = {};
    
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
      query.available = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) query.subject = subject;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      };
    }

    const books = await Book.find(query)
      .populate('seller', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('seller', 'firstName lastName email phone address');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching book',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      description,
      subject,
      condition,
      price,
      quantity,
      images,
      sellerId
    } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const book = new Book({
      title,
      author,
      isbn,
      description,
      subject,
      condition,
      price,
      quantity,
      originalQuantity: quantity,
      images,
      seller: sellerId,
      location: seller.location
    });

    await book.save();
    await book.populate('seller', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
});

router.put('/:id/quantity', async (req, res) => {
  try {
    const { quantity, sellerId } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own books'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    book.quantity = quantity;
    book.available = quantity > 0;
    await book.save();

    await book.populate('seller', 'firstName lastName email');

    res.json({
      success: true,
      message: `Book quantity updated to ${quantity}`,
      data: book
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating quantity',
      error: error.message
    });
  }
});

module.exports = router;
