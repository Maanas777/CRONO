const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product"
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  total: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Pending', 'Cancelled', 'Refunded Amount', 'Delivered', 'Returned'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  payment_method: {
    type: String,
    enum: ['Razorpay', 'credit_card', 'COD', 'paypal']
  },
  address: {
    type: Object
  },
  reason: {
    type: String
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.virtual('returnExpired').get(function() {
  const deliveryDate = this.createdAt;
  const currentDate = new Date();
  const daysPassed = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));
  return daysPassed > 3; // Return true if more than 3 days have passed since delivery, otherwise false
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
