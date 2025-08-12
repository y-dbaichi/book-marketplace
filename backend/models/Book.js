const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  isbn: String,
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Science', 'Geography', 'Mathematics', 'History', 'Literature', 'Other']
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  originalQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  images: [{
    type: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  available: {
    type: Boolean,
    default: true
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

bookSchema.pre('save', function(next) {
  this.available = this.quantity > 0;
  this.updatedAt = Date.now();
  next();
});

bookSchema.methods.reduceQuantity = function(amount) {
  if (this.quantity >= amount) {
    this.quantity -= amount;
    this.available = this.quantity > 0;
    return true;
  }
  return false;
};

bookSchema.methods.increaseQuantity = function(amount) {
  this.quantity += amount;
  this.available = true;
  return true;
};

bookSchema.index({ location: '2dsphere' });
bookSchema.index({ subject: 1 });
bookSchema.index({ condition: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ available: 1 });
bookSchema.index({ quantity: 1 });

module.exports = mongoose.model('Book', bookSchema);
