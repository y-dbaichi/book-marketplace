const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const checkoutRoutes = require('./routes/checkout');
const clerkWebhookRoutes = require('./routes/clerk-webhook');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'BookMarket API is running!',
    endpoints: {
      books: '/api/books',
      users: '/api/users', 
      orders: '/api/orders',
      checkout: '/api/checkout'
    }
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-marketplace');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`  Books: http://localhost:${PORT}/api/books`);
  console.log(`  Users: http://localhost:${PORT}/api/users`);
  console.log(`  Orders: http://localhost:${PORT}/api/orders`);
  console.log(`  Checkout: http://localhost:${PORT}/api/checkout`);
});
