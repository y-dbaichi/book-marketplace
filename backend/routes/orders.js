const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');
const router = express.Router();

// GET /api/orders/user/:clerkId - Get orders for buyer by Clerk ID
router.get('/user/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const orders = await Order.find({ buyer: user._id })
      .populate(['buyer', 'seller', 'items.book'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    });
  }
});

// GET /api/orders/seller/:clerkId - Get orders for seller by Clerk ID
router.get('/seller/:clerkId', async (req, res) => {
  try {
    const seller = await User.findOne({ clerkId: req.params.clerkId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const orders = await Order.find({ seller: seller._id })
      .populate(['buyer', 'seller', 'items.book'])
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

// GET /api/orders/:id - Get specific order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate(['buyer', 'seller', 'items.book']);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, message, location, coordinates, updatedByClerkId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updater = await User.findOne({ clerkId: updatedByClerkId });
    if (!updater) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add tracking update
    order.trackingUpdates.push({
      status,
      message: message || `Order status updated to ${status}`,
      location: location || '',
      coordinates: coordinates || [0, 0],
      updatedBy: updater._id,
      timestamp: new Date()
    });

    order.status = status.toLowerCase().replace(/\s+/g, '_');
    
    if (order.status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();
    await order.populate(['buyer', 'seller', 'items.book']);

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

// POST /api/orders/:id/tracking - Add tracking update
router.post('/:id/tracking', async (req, res) => {
  try {
    const { status, message, location, coordinates, updatedByClerkId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updater = await User.findOne({ clerkId: updatedByClerkId });
    if (!updater) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    order.trackingUpdates.push({
      status,
      message,
      location,
      coordinates,
      updatedBy: updater._id,
      timestamp: new Date()
    });

    await order.save();
    await order.populate(['buyer', 'seller', 'items.book']);

    res.json({
      success: true,
      message: 'Tracking update added successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding tracking update',
      error: error.message
    });
  }
});

module.exports = router;
