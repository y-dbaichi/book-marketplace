const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');
const router = express.Router();

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const {
      buyerId,
      items, // [{ bookId, quantity }]
      deliveryAddress
    } = req.body;

    // Get buyer
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Process items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book || !book.available) {
        return res.status(400).json({
          success: false,
          message: `Book ${book ? book.title : 'unknown'} is not available`
        });
      }

      const itemTotal = book.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        price: book.price
      });

      // Mark book as unavailable
      book.available = false;
      await book.save();
    }

    // Set delivery location
    let deliveryLocation = buyer.location;
    if (deliveryAddress && deliveryAddress.coordinates) {
      deliveryLocation = {
        type: 'Point',
        coordinates: deliveryAddress.coordinates
      };
    }

    const order = new Order({
      buyer: buyerId,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress || buyer.address,
      deliveryLocation,
      status: 'Pending'
    });

    await order.save();
    await order.populate(['buyer', 'items.book']);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// GET /api/orders/buyer/:buyerId - Get orders for buyer
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.params.buyerId })
      .populate(['buyer', 'items.book'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// GET /api/orders/seller/:sellerId - Get orders for books sold by seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    // Find all books by this seller
    const sellerBooks = await Book.find({ seller: req.params.sellerId });
    const bookIds = sellerBooks.map(book => book._id);

    // Find orders containing these books
    const orders = await Order.find({
      'items.book': { $in: bookIds }
    })
    .populate(['buyer', 'items.book'])
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching seller orders',
      error: error.message
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();
    await order.populate(['buyer', 'items.book']);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

module.exports = router;
