require("dotenv").config();

const bcrypt = require('bcryptjs')
const Razorpay = require('razorpay');
const usersSchema = require('../model/model')
const productSchema = require('../model/product_model')
const cartSchema = require('../model/cart_model')
const categorySchema=require('../model/add_category')
const adressSchema = require('../model/adress')
const orderSchema = require('../model/order')
const couponSchema = require('../model/coupon')
const walletSchema = require('../model/wallet')
const accountSid = process.env.Account_SID;
const authToken = process.env.Auth_Token;
const serviceId = "VAa73f82e318c35b309ad7c8dbf41892bf"
const client = require("twilio")(accountSid, authToken);
const mongoose = require('mongoose');
const paypal = require('paypal-rest-sdk');
// const { default: orders } = require("razorpay/dist/types/orders");





///signup
exports.create = async (req, res) => {
  try {
    let user = req.session.user;
    const existingUser = await usersSchema.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      return res.render('user/signup', { user: req.session.user,msg: "User already exists" });
    } else {
      const saltRounds = 10; // You can adjust the number of salt rounds as needed
      bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        if (err) {
          return res.status(500).send({
            message: "Some error occurred while hashing the password",
          });
        }

        const newUser = new usersSchema({
          name: req.body.name,
          email: req.body.email,
          username: req.body.username,
          phone: req.body.phone,
          password: hash,
        });

        try {
          await newUser.save();
          return res.render("user/signup", { user: req.session.user, msg: "Successfully registered" });
        } catch (err) {
          return res.status(500).send({
            message: "Some error occurred while registering the user",
          });
        }
      });
    }
  } catch (err) {
    return res.status(500).send({
      message: "Some error occurred",
    });
  }
};







//login

exports.find_user = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await usersSchema.findOne({ email: email });


    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);


      if (isMatch) {
        if (user.isBlocked) {
          res.render("user/login", {
            message: "user cant be login plz contact admin",
            user // Pass the "user" object to the view
          });
        } else {

          req.session.user = user;
          res.redirect("/");
        }
      } else {
        res.render("user/login", { message: "Invalid Passowrd", user });
      }
    } else {
      res.render("user/login", { message: "Invalid User", user });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred while logging in");
  }
};

//logout

exports.logout = (req, res) => {
  req.session.user = false;

  req.session.destroy();
  res.redirect("/");
};

exports.show_product = async (req, res) => {
  const pageSize = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await productSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
  const product = await productSchema.find().skip(skip).limit(pageSize)

  const category=await categorySchema.find()
  console.log(category);
  let user = req.session.user

  res.render("user/shop", { product, user,category ,totalPages, currentPage })
}

exports.filter_category=async(req,res)=>{
  try{
    const pageSize = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await productSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    let user = req.session.user
    const id = req.params.id;
    const categori = await categorySchema.findOne({_id:id});
    const product = await productSchema.find({brand:categori.category}).skip(skip).limit(pageSize)
    console.log('ss',product);

    const category=await categorySchema.find()
  
    res.render("user/shop", { product, user,category,currentPage,totalPages })
  }
  catch(error){
    console.log(error);
    res.status(500).send({error:"internal server error"})
 }

}




exports.single_products = async (req, res) => {
  const id = req.params.id
  let user = req.session.user
  // console.log(user);
  const product = await productSchema.findById(id)

  res.render('user/single_product', { product, user: user })
}

//low to high
exports.LowToHigh = async (req, res) => {
  const pageSize = 12;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    const category= await categorySchema.find()
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: false });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema
      .find({ Blocked: false })
      .sort({ price: 1 })
      .skip(skip)
      .limit(pageSize);
    res.render("user/shop", {
      product,
      user,
      user_id,
      totalPages,
      currentPage,
      category
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products" });
  }
};


//high to low

exports.HighToLow = async (req, res) => {
  const pageSize = 12;
  const currentPage = parseInt(req.query.page) || 1;

  try {
    const category= await categorySchema.find()

    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: false });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema
      .find({ Blocked: false })
      .sort({ price: -1 })
      .skip(skip)
      .limit(pageSize);

      console.log(product);
    res.render("user/shop", {
      product,
      user,
      user_id,
      totalPages,
      currentPage,
      category
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products"});
}
};











//otp

// exports.sendotp = async (req, res) => {
//   const phone = req.body.phone
//  let user=req.session.user

//   const existingUser = await usersSchema.findOne({ phone: phone });
//   if (!existingUser) {
//     return res.render("user/forgot_otp", { msg: 'Phone Number Not Found', user: user });

//   }
//   req.session.phone = phone;

//   try {

//     const otpResponse = await client.verify.v2
//       .services(serviceId)
//       .verifications.create({
//         to: "+91" + phone,
//         channel: "sms"
//       })
//     res.render('user/fpverify_otp', { msg: "otp send successfully",user: user })

//   } catch (error) {
//     res.status(error?.status || 400)
//       .send(error?.message || "something went wrong")
//   }
// }

// //verify otp

// exports.verifyotp = async (req, res) => {
//   let user=req.session.user
//   const verificationCode = req.body.otp
//   const phoneNumber = req.session.phone
//   // console.log(phoneNumber);
//   // console.log(verificationCode);

//   if (!phoneNumber) {
//     res.status(400).send({ message: "phone number is required" })
//     return
//   }
//   try {
//     // Verify the SMS code entered by the user
//     const verification_check = await client.verify.v2
//       .services(serviceId)
//       .verificationChecks.create
//       ({
//         to: '+91' + phoneNumber,
//         code: verificationCode
//       });
//     const user = await usersSchema.findOne({ phone: phoneNumber })
//     const username = user.name;
//     const userId = user._id;


//     if (verification_check.status === 'approved') {

//       res.render('user/forgot_password',{user: user});
//     } else {
//       // If the verification fails, return an error message
//       res.render('user/fpverify_otp', { msg: "Invalid verification code",user: user });
//     }
//   } catch (err) {
//     res.status(500).send({ message: err.message || "Some error occurred while verifying the code" });
//   }

// }



exports.getCart = async (req, res) => {
  let user = req.session.user
  if (user) {

    let userId = req.session.user._id

    let cart = await cartSchema.findOne({ userId: userId }).populate(
      "products.productId"
    )
    if (cart) {
      let products = cart.products
      res.render('user/cart', { user, products })

    } else {
      res.render('user/emptyCart', { user })
    }

  }
  else {
    res.redirect('/login')
  }

  // res.render('user/cart',{user,products})
}

exports.addtocart = async (req, res) => {
  let user = req.session.user
  
  if (user) {
    try {
      const userId = req.session.user?._id;
      const productId = req.params.id;
      console.log(productId,"productId");

      let userCart = await cartSchema.findOne({ userId: userId });

      if (!userCart) {
        // If the user's cart doesn't exist, create a new cart
        const newCart = new cartSchema({ userId: userId, products: [] });
        await newCart.save();
        userCart = newCart;
      }

      const productIndex = userCart.products.findIndex(
        (product) => product.productId == productId

      );


      if (productIndex === -1) {
        // If the product is not in the cart, add it
        userCart.products.push({ productId, quantity: 1 });

      }
      else {
        // If the product is already in the cart, increase its quantity by 1
        userCart.products[productIndex].quantity += 1;

      }

      await userCart.save();


      res.json({ message: 'Product added to cart successfully' });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }

  } else {
    res.redirect('/login')
  }

};




// increment quantity 

exports.  increase_product = async (req, res) => {

  const userId = req.session.user
  const cartId = req.body.cartId
  // console.log(cartId);


  try {
    const cart = await cartSchema.findOne({ userId: userId }).populate("products.productId")
    // console.log(cart);


    let cartIndex = cart.products.findIndex(items => items.productId.equals(cartId))



    cart.products[cartIndex].quantity += 1

    const products = cart.products[cartIndex].productId;
    const maxQuantity = products.stock;

    if (cart.products[cartIndex].quantity > maxQuantity) {
      return res.json({
        success: false,
        message: "Maximum quantity reached.",
        maxQuantity
      });
    }

    await cart.save()

    const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price
    const quantity = cart.products[cartIndex].quantity;
    console.log(total);



    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total,
      quantity,
    });

  }
  catch (err) {
    res.json({ success: false, message: "Failed to update quantity." });
  }

}



// decrement 

exports.decreaseQuantity = async (req, res) => {



  const cartItemId = req.body.cartItemId
  const userId = req.session.user?._id


  try {
    const cart = await cartSchema.findOne({ userId: userId }).populate("products.productId")

    const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId))

    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });

    }
    cart.products[cartIndex].quantity -= 1
    await cart.save()

    const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.price;

    const quantity = cart.products[cartIndex].quantity;
    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update quantity." });
  }

}



exports.remove_product = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;

    const result = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );

    if (result) {
      res.json({ message: 'Product Removed from Cart' });
    } else {
      // No matching document found
      throw new Error("Product not found in the cart.");
    }
  } catch (err) {
    // Handle the error
    res.status(500).send(err.message);
  }
};


exports.address= async (req, res) => {
  let user = req.session.user
  if (user) {
    try {
      const data = await usersSchema.findOne({ _id: user })

      res.render('user/add_address', { user, data: data.address })
    }
    catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
  else {
    res.redirect('/')
  }



}

//post method
exports.add_address = async (req, res) => {

  try {
    const userId = req.session.user
    const { name, address, phone, zip, city, state } = req.body

    const user = await usersSchema.findOne({ _id: userId })

    if (!user) {
      res.status(404).send('User not found.');
      return;
    }
    // Push the new address data to the existing address array

    user.address.push({ name, address, phone, zip, city, state })

    await user.save()
    res.redirect('/add_adress')

  }
  catch (err) {
    console.error(err);
    res.status(500).send('Error finding/updating user.');
  }


}



//checkout

exports.checkout = async (req, res) => {
  try {
    let id = req.params.id;
    let userId = req.session.user?._id;
    const user = req.session.user;

    let userAdd = await usersSchema.findOne({ _id: userId },
      { address: { $elemMatch: { _id: id } } });

    const allCoupons = await couponSchema.find();

    const updatedUserDetails= await usersSchema.find({_id:userId})
   console.log("jkk",updatedUserDetails,"opop");
    const usedCoupon=updatedUserDetails[0].coupon
    console.log(usedCoupon,"popo");

  ;
    const availableCoupons = allCoupons.filter(coupon => !usedCoupon.includes(coupon.code));
    console.log(availableCoupons);
    


    let cart = await cartSchema.findOne({ userId: user }).populate("products.productId");
    
    if (userAdd) {
      const address = user.address[0];

      res.render('user/check_out', { user, cart, address, coupon: availableCoupons });
    } else {
      res.status(404).send('Address not found');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
};




//order confirmation


let paypalTotal = 0;
exports.orderConfirmation = async (req, res) => {
  if (req.session.user) {
    try {
      const payment = req.body.payment
      const name = req.body.name
      const user = req.session.user
      const userId = req.session.user?._id
      const id = req.params.id
      const total = req.body.total;

      const cartdisc= await cartSchema.findOne({userId:userId})
     
      const discount=cartdisc.total
      const wallet_discount=cartdisc.wallet
      console.log(wallet_discount,'////////////////////////////////////////')
      const userModel = await usersSchema.findById(userId)

      const addressIndex = userModel.address.findIndex((item) =>
        item._id.equals(id)
      )

      const specifiedAddress = userModel.address[addressIndex]


      const cart = await cartSchema.findOne({ userId: userId }).populate("products.productId")
      cart ? console.log(cart) : console.log("Cart not found");

      const items = cart.products.map(item => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.price;

        if (!price) {
          throw new Error("Product price is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }

        return {
          product: product._id,
          quantity: quantity,
          price: price,
        }

      })

      console.log(items);

      

      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice += (item.price * item.quantity)
      });

      if (discount) {
        totalPrice -= discount;
      }

     
  if (wallet_discount!=totalPrice && wallet_discount>=0) {
    totalPrice -= wallet_discount;
   
    
  }
  
      if (req.query.couponValue) {
        const couponValue = parseFloat(req.query.couponValue);
        if (!isNaN(couponValue)) {
          totalPrice -= couponValue;
        }
      }
    

      // will continue
      if (payment == "COD") {
        console.log("xxxxxxxx");
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        });
        let data = order
        await order.save()
         console.log(order,"//////////////////////////////////");

        await cartSchema.deleteOne({ userId: userId });


        res.render('user/confirmation', { user, userId, specifiedAddress, cart, payment, data, totalPrice })
      }


      else if (payment == "paypal") {



        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,

        })
       req.session.order=order

        cart.products.forEach((element) => {
          paypalTotal += totalPrice;
        });



        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: "http://smartcrono.shop/paypal-success",
            cancel_url: "http://smartcrono.shop/paypal-err",
          },
          transactions: [
            {
              amount: {
                currency: "USD",
                total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
              },
              description: "Super User Paypal Payment",
            },
          ],
        };

        paypal.payment.create(createPayment, function (error, payment) {
          if (error) {
            throw error;
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
              
                res.redirect(payment.links[i].href);
              }
            }
            
          }
        });


      }


    } catch (error) {
      console.log(error);
      res.status(500).send("network error")
    }

  } else {
    res.redirect("/")
  }
}




exports.paypal_success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const user = req.session.user;
  const userId = req.session.user?._id;

  const order=req.session.order

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: paypalTotal,
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));
const order_details=new orderSchema({
  ...order
})

await order_details.save()
      // Delete products from the cart
      await cartSchema.deleteOne({ userId: userId });

      res.render("user/paypalSuccess", { payment, user, userId });
    }
  });
};



exports.paypal_err = (req, res) => {
  console.log(req.query);
  res.send("error")
}




exports.order_find = async (req, res) => {
  let user = req.session.user
  let userId=req.session.user?._id

  const order = await orderSchema.find({user:userId}).populate("items.product")
 
  const orderDetails = order.map((order) => {
    return {
      _id: order._id,
      items: order.items,
      total: order.total,
      status: order.status,
      payment_method: order.payment_method,
      createdAt: order.createdAt,
      address: order.address,
      returnExpired: order.returnExpired,
    };
  });
;


  res.render('user/order', { orderDetails, user })

}



exports.cancel_product = async (req, res) => {
  let id = req.params.id;

  try {
    const order = await orderSchema.findByIdAndUpdate(id, { reason: req.body.reason });

    const cancel_product = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: 'Cancelled'
      },
      { new: true }
    );

    const wallet = await walletSchema.findOne({ userId: order.user });
    if (wallet) {
      wallet.balance += order.total;
      wallet.transactions.push(order.payment_method);
      await wallet.save();
    } else {
      const newWallet = new walletSchema({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method]
      });
      await newWallet.save();
    }

    await orderSchema.updateOne({ _id: id }, { $set: { status: 'Refunded Amount' } });

    if (cancel_product) {
      // Show toaster message
      res.send("Order cancelled successfully.");
    } else {
      // Product not found
      res.send("Error cancelling the order.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};




exports.return_product = async (req, res) => {

  let id = req.params.id

  const reason= new orderSchema({
    reason:req.body.reason
  
  }) 


  const return_product = await orderSchema.findByIdAndUpdate(id, {

    status: 'Returned'
  },
    { new: true }
  )

  console.log(return_product.status,"8989757");

  if (return_product) {
    res.send("Order Returned successfully.")
  }
  else {
    // Product not found
    res.send("Error Whuile Returning the order.");;
  }
}

exports.view_order=async(req,res)=>{
  console.log("09080709");
let id=req.params.id
let user=req.session.user

const order= await orderSchema.findById({_id:id}).populate("items.product")
console.log(order,"0576675");
res.render('user/view_order',{user,order} )


}

exports.invoice =async(req,res)=>{
  let user=req.session.user
  let id= req.params.id
  const order= await orderSchema.findById({_id:id}).populate("items.product")

  res.render('user/invoice',{user,order})
}
















//coupon
exports.redeem_coupon = async (req, res) => {
  const { coupon } = req.body;
  const userId = req.session.user._id;

  const couponFind = await couponSchema.findOne({ code: coupon });
  const userCoupon = await usersSchema.findById(userId);

  if (userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: 'Coupon Already used'
    });
  
  }
 

  userCoupon.coupon.push(coupon);

  await userCoupon.save();

  if (!couponFind || couponFind.status === false) {
    return res.json({
      success: false,
      message: couponFind ? 'Coupon Deactivated' : 'Coupon not found'
    });
  }

  const currentDate = new Date();
  const expirationDate = new Date(couponFind.date);

  if (currentDate > expirationDate) {
    return res.json({
      success: false,
      message: 'Coupon Expired'
    });
  }

  const amount = couponFind.discount;

  res.json({
    success: true,
    message: 'Coupon available',
    couponFind,
    amount: parseInt(amount)
  });


  try {
    
    const cart = await cartSchema.findOne({userId:userId})
   cart.total=amount
   
    if (!cart) {
 console.log("Cart not found");
      return; // or throw an error
    }
  
    cart.total = amount;

    await cart.save();

  } catch (error) {
    console.error("Error updating cart:", error);
    // handle the error appropriately
  }
  

};
exports.deleteCoupon= async(req,res)=>{

 
  const userId = req.session.user._id;
    const userCoupon = await usersSchema.findById(userId);

    const coupon = userCoupon.coupon.pop();

    userCoupon.save();
    const cart = await cartSchema
    .findOne({ userId: userId })
    .populate("products.productId");
  
  let totalPrice = 0;
  const items = cart.products.map((item) => {
    const product = item.productId; // Access the productId instead of product
    const quantity = item.quantity;
    const price = product.price;
  
    totalPrice += price * quantity;
  
    return { product, quantity, price }; // Return an object with the desired properties
  });
  
    // totalPrice += 50;
    
    cart.total = 0; //coupon amount
    cart.save();
  
    res.json({
      success: true,
      message: "coupon deleted successfully.",
      totalPrice,
    });
  };
  











//forgot password

exports.otp_page = (req, res) => {
  let user = req.session.user
  res.render('user/forgot_otp', { user })
}





exports.forgot_password = async (req, res) => {
  let user=req.session.user
  const phoneNumber = req.session.phone;
  const password = req.body.password;
  console.log(phoneNumber, "**)(");


  try {

    usersSchema.findOne({ phone: phoneNumber }).then((user) => {
      const saltRounds = 10; // You can adjust the number of salt rounds as needed
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          res.status(500).send({
            message:
              err.message || "Some error occurred while hashing the password",
          });
        } else {
          usersSchema
            .findOneAndUpdate(
              { phone: phoneNumber },
              { password: hash },
              { useFindAndModify: false }
            )
            .then((data) => {
              if (!data) {
                res
                  .status(404)
                  .send({
                    message: `Cannot update user with ID: ${phone}. User not found.`,
                  });
              } else {
                res.render("user/login", {
                  message: "Successfully updated password",user: user
                });
              }
            })
            .catch((err) => {
              res
                .status(500)
                .send({ message: "Error updating user information" });
            });
        }
      });
    });
  } catch (err) {
    res
      .status(500)
      .send({
        message: err.message || "Some error occurred while verifying the code",
      });
  }
}



exports.Wallet = async (req, res) => {
  const userId = req.session.user?._id;
  console.log(userId);
  const user = req.session.user;
  let sum = 0;

  try {
    const walletbalance = await walletSchema.findOne({ userId: userId }).populate('orderId');
    const orderdetails = await orderSchema.find({ user: user, status: "Refunded Amount" }).populate('items.product');
    console.log(walletbalance, "//////87686/////");

    if (walletbalance) {
      sum += walletbalance.balance;
    }

    res.render('user/wallet', { user, wallet: walletbalance?.orderId, sum, walletbalance, orderdetails });
  } catch (err) {
    console.log(err);
  }
};


  exports.wallet_buy = async(req,res)=>{
    try{
      const userId= req.session.user._id
   

      const wallet = await walletSchema.findOne({ userId: userId });
     const cart= await cartSchema.findOne({userId:userId}).populate("products.productId")
     let totalprice=0

     const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.price
     
     
      totalprice += price * quantity;
      
     })

     console.log(totalprice,"kk q");
     const balance = (10 / 100) * totalprice;

      let wallet_balance= wallet.balance
       if (balance <  wallet.balance) {
     totalprice -= balance;
     cart.wallet = balance;
      await cart.save();


        
       wallet.balance-=balance

       console.log( wallet.balance,"before");
        await wallet.save();
        console.log( wallet.balance,"after");


    }
    res.json({
      success: true,
      message: "Wallet add Successful",
      totalprice,
      wallet_balance
    });
  
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }








};



exports.search_product = async (req, res) => {
  let user=req.session.user
  const search = req.body.search;
  try {
    const regex = new RegExp(search, 'i');
    const product = await productSchema.find({ name: regex });
    const category = await categorySchema.find().exec();

    res.render('user/shop', { product, category,user })
  } catch (err) {
    console.log(err);
  }

};

exports.user_profile= async(req,res)=>{
  let user = req.session.user
  let id=req.params.id

  let find_user= await usersSchema.findById({_id:id})
  res.render('user/profile',{user,find_user})

}


exports.sortProducts = async (req, res) => {
  const pageSize = 12;
  const currentPage = parseInt(req.query.page) || 1;
  const sortOption = req.query.sort || 'l-h';

  try {
    const category = await categorySchema.find();
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: false });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;

    let sortQuery = {};

    if (sortOption === 'l-h') {
      sortQuery = { price: 1 }; // Sort by price: Low to High
    } else if (sortOption === 'h-l') {
      sortQuery = { price: -1 }; // Sort by price: High to Low
    }

    const product = await productSchema
      .find({ Blocked: false })
      .sort(sortQuery)
      .skip(skip)
      .limit(pageSize);

    res.render("user/shop", {
      product,
      user,
      user_id,
      totalPages,
      currentPage,
      category,
      
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products" });
  }
};

