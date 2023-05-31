const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],

    total: {
      type: Number,
      
    }
    
  },
  { timestamps: true }
);
const cart = new mongoose.model("Cart", CartSchema);
module.exports = cart;