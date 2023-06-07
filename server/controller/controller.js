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
    const existingUser = await usersSchema.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      return res.render('user/signup', { msg: "User already exists" });
    }
    else {
      const saltRounds = 10; // You can adjust the number of salt rounds as needed
      bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        if (err) {
          return res.status(500).send({
            message: "Some error occurred while hashing the password",
          });
        }

        const user = new usersSchema({
          name: req.body.name,
          email: req.body.email,
          username: req.body.username,
          phone: req.body.phone,
          password: hash,
        });

        try {
          await user.save();
          return res.render("user/login", { msg: "Successfully registered" });
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
  const product = await productSchema.find()

  const category=await categorySchema.find()
  console.log("aa",category);
  let user = req.session.user

  res.render("user/shop", { product, user,category })
}

exports.filter_category=async(req,res)=>{
  try{
    let user = req.session.user
    const id = req.params.id;
    const categori = await categorySchema.findOne({_id:id});
    const product = await productSchema.find({brand:categori.category})
    console.log('ss',product);

    const category=await categorySchema.find()
  
    res.render("user/shop", { product, user,category })
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

//otp

exports.sendotp = async (req, res) => {
  const phone = req.body.phone
  // console.log(phone);

  const existingUser = await usersSchema.findOne({ phone: phone });
  if (!existingUser) {
    return res.render("user/forgot_otp", { msg: 'Phone Number Not Found' });
  }
  req.session.phone = phone;




  try {

    const otpResponse = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: "+91" + phone,
        channel: "sms"
      })
    res.render('user/fpverify_otp', { msg: "otp send successfully" })

  } catch (error) {
    res.status(error?.status || 400)
      .send(error?.message || "something went wrong")
  }
}

//verify otp

exports.verifyotp = async (req, res) => {

  const verificationCode = req.body.otp
  const phoneNumber = req.session.phone
  // console.log(phoneNumber);
  // console.log(verificationCode);

  if (!phoneNumber) {
    res.status(400).send({ message: "phone number is required" })
    return
  }
  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create
      ({
        to: '+91' + phoneNumber,
        code: verificationCode
      });
    const user = await usersSchema.findOne({ phone: phoneNumber })
    const username = user.name;
    const userId = user._id;


    if (verification_check.status === 'approved') {

      res.render('user/forgot_password');
    } else {
      // If the verification fails, return an error message
      res.render('user/otp_login', { msg: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while verifying the code" });
  }

}

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


exports.address = async (req, res) => {
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
    let id = req.params.id
    let userId = req.session.user?._id



    let user = await usersSchema.findOne({ _id: userId },
      { address: { $elemMatch: { _id: id } } })

  
    
    const coupon= await couponSchema.find()


    let cart = await cartSchema.findOne({ userId: user }).populate(
      "products.productId"
    )
    if (user) {
      const address = user.address[0];

      res.render('user/check_out', { user, cart, address,coupon })
    }
    else {
      res.status(404).send('Address not found');

    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
}



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

      if (req.query.couponValue) {
        const couponValue = parseFloat(req.query.couponValue);
        if (!isNaN(couponValue)) {
          totalPrice -= couponValue;
        }
      }

      // will continue
      if (payment == "COD") {

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
        await order.save()

        cart.products.forEach((element) => {
          paypalTotal += totalPrice;
        });



        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: "http://localhost:3002/paypal-success",
            cancel_url: "http://localhost:3002/paypal-err",
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
  const user = req.session.user
  const userId = req.session.user?._id






  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": paypalTotal
      }
    }]
  };
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.



    if (error) {
      console.log(error.response);
      throw error;
    } else {

    
      console.log(JSON.stringify(payment));
      res.render("user/paypalSuccess", { payment, user, userId, })
    }
  });

}


exports.paypal_err = (req, res) => {
  console.log(req.query);
  res.send("error")
}




exports.order_find = async (req, res) => {
  let user = req.session.user
  let userId=req.session.user?._id

  const order = await orderSchema.find({user:userId}).populate("items.product")

  res.render('user/order', { order, user })

}



exports.cancel_product = async (req, res) => {

  let id = req.params.id

  await orderSchema.findByIdAndUpdate(id, { reason: req.body.reason });


  const cancel_product = await orderSchema.findByIdAndUpdate(id,
    {
      status: 'Cancelled'
    },
    { new: true }

  )
  if (cancel_product) {
    res.redirect("/order_page");

  } else {
    // Product not found

    res.send("error");
  }
}





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
    res.redirect("/order_page");
  }
  else {
    // Product not found

    res.send("error");
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


//forgot password

exports.otp_page = (req, res) => {
  let user = req.session.user
  res.render('user/forgot_otp', { user })
}





exports.forgot_password = async (req, res) => {

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
                  message: "Successfully updated password",
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
  const user = req.session.user;

  try {
    const orderdetails = await orderSchema.find({ status: "Refunded Amount" }).populate('items.product');
     console.log(orderdetails,"///////////")

  
    const wallet_data = await walletSchema.find({ userId: userId });


    res.render('user/wallet', {  user, orderdetails, wallet_data });
  } catch (err) {
    console.log(err);
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


