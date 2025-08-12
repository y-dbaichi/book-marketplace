const express = require('express');
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      buyerClerkId,
      items,
      orderType,
      deliveryAddress
    } = req.body;

    const buyer = await User.findOne({ clerkId: buyerClerkId });
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    let totalAmount = 0;
    const orderItems = [];
    let seller = null;

    for (const item of items) {
      const book = await Book.findById(item.bookId).populate('seller');
      
      if (!book) {
        return res.status(400).json({
          success: false,
          message: `Book not found`
        });
      }

      if (book.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${book.quantity} copies of "${book.title}" are available, but you requested ${item.quantity}`
        });
      }

      if (book.quantity === 0) {
        return res.status(400).json({
          success: false,
          message: `"${book.title}" is currently out of stock`
        });
      }

      if (!seller) {
        seller = book.seller;
      } else if (seller._id.toString() !== book.seller._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All books must be from the same seller'
        });
      }

      const itemTotal = book.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        price: book.price
      });
    }

    let deliveryLocation = buyer.location;
    if (deliveryAddress && deliveryAddress.coordinates) {
      deliveryLocation = {
        type: 'Point',
        coordinates: deliveryAddress.coordinates
      };
    }

    const order = new Order({
      buyer: buyer._id,
      seller: seller._id,
      items: orderItems,
      totalAmount,
      orderType,
      deliveryAddress: deliveryAddress || buyer.address,
      deliveryLocation,
      status: 'pending',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      trackingUpdates: [{
        status: 'Order Placed',
        message: `Order placed successfully for ${orderItems.length} item(s). ${orderType === 'delivery' ? 'Preparing for delivery' : 'Ready for pickup confirmation'}.`,
        location: seller.address ? `${seller.address.city}, ${seller.address.state}` : 'Seller Location',
        coordinates: seller.location.coordinates,
        updatedBy: buyer._id,
        timestamp: new Date()
      }]
    });

    await order.save();

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      book.reduceQuantity(item.quantity);
      await book.save();
    }

    await order.populate(['buyer', 'seller', 'items.book']);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing checkout',
      error: error.message
    });
  }
});

router.post('/update-tracking', async (req, res) => {
  try {
    const {
      orderId,
      status,
      message,
      location,
      coordinates,
      updatedByClerkId
    } = req.body;

    const order = await Order.findById(orderId);
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

    order.status = status.toLowerCase().replace(/\s+/g, '_');
    
    if (order.status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();
    await order.populate(['buyer', 'seller', 'items.book']);

    res.json({
      success: true,
      message: 'Tracking updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Tracking update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tracking',
      error: error.message
    });
  }
});

module.exports = router;
