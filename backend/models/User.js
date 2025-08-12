const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  // Seller-specific fields
  businessName: {
    type: String,
    required: function() { return this.userType === 'seller'; }
  },
  description: {
    type: String,
    default: ''
  },
  // Buyer-specific fields
  preferences: {
    favoriteGenres: [String],
    maxDistance: {
      type: Number,
      default: 50 // km
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  phone: String,
  isActive: {
    type: Boolean,
    default: true
  },
  // Seller metrics
  sellerStats: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalBooks: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
