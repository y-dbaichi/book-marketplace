const express = require('express');
const { Webhook } = require('svix');
const User = require('../models/User');
const router = express.Router();

// Clerk webhook endpoint for user events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return res.status(400).json({ error: 'Missing CLERK_WEBHOOK_SECRET' });
    }

    const headers = req.headers;
    const payload = req.body;

    const wh = new Webhook(webhookSecret);
    let evt;

    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const { id, email_addresses, first_name, last_name } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook received: ${eventType} for user ${id}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const email = email_addresses?.[0]?.email_address;
      
      if (!email) {
        console.error('No email found in webhook data');
        return res.status(400).json({ error: 'No email address found' });
      }

      // Create or update user in our database
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email: email,
          firstName: first_name || '',
          lastName: last_name || '',
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );

      console.log(`User ${eventType}: ${email}`);
    }

    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`User deleted: ${id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
