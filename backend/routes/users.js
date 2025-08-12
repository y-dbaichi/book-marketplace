const express = require('express');
const User = require('../models/User');
const router = express.Router();

// POST /api/users - Create or update user (for Clerk integration)
router.post('/', async (req, res) => {
  try {
    const {
      clerkId,
      email,
      firstName,
      lastName,
      address,
      phone
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ clerkId });

    if (user) {
      // Update existing user
      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.address = address;
      user.phone = phone;
      await user.save();
    } else {
      // Create new user
      user = new User({
        clerkId,
        email,
        firstName,
        lastName,
        address,
        phone
      });
      await user.save();
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating/updating user',
      error: error.message
    });
  }
});

// GET /api/users/:clerkId - Get user by Clerk ID
router.get('/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// PUT /api/users/:clerkId/location - Update user location
router.put('/:clerkId/location', async (req, res) => {
  try {
    const { address, coordinates } = req.body;

    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (address) user.address = address;
    if (coordinates && coordinates.length === 2) {
      user.location = {
        type: 'Point',
        coordinates: coordinates // [longitude, latitude]
      };
    }

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user location',
      error: error.message
    });
  }
});

module.exports = router;
