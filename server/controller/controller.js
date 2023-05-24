require("dotenv").config();

const bcrypt = require('bcryptjs')

const usersSchema = require('../model/model')
const productSchema = require('../model/product_model')
const cartSchema = require('../model/cart_model')
const adressSchema = require('../model/adress')
const orderSchema = require('../model/order')
const accountSid = process.env.Account_SID;
const authToken = process.env.Auth_Token;
const serviceId = "VAa73f82e318c35b309ad7c8dbf41892bf"
const client = require("twilio")(accountSid, authToken);






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
          });
        } else {

          req.session.user = user;
          res.redirect("/");
        }
      } else {
        res.render("user/login", { message: "Invalid Passowrd" });
      }
    } else {
      res.render("user/login", { message: "Invalid User" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred while logging in");
  }
};

//logout

exports.logout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("error")
    }
    else {
      res.render('user/login')
    }
  })
}

exports.show_product = async (req, res) => {
  const product = await productSchema.find().limit(6);
  let user = req.session.user
  if (user) {
    res.render("user/shop", { product, user: user })
  }
  else {
    res.redirect('/login')
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
    return res.render("user/otp_login");
  }
  req.session.phone = phone;




  try {

    const otpResponse = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: "+91" + phone,
        channel: "sms"
      })
    res.render('user/otp_login', { msg: "otp send successfully" })

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
      // If the verification is successful, do something

      // req.session.isAuth=true;
      // req.session.username = username;
      // req.session.user = user;
      res.redirect('/');
    } else {
      // If the verification fails, return an error message
      res.render('user/otp_login', { msg: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while verifying the code" });
  }

}

exports.getCart = async (req, res) => {

  let userId = req.session.user._id
  let user = req.session.user
  let cart = await cartSchema.findOne({ userId: userId }).populate(
    "products.productId"
  )
  if (cart) {
    let products = cart.products
    res.render('user/cart', { user, products })
    console.log("123");
    console.log(cart);
    console.log("123");
  } else {
    res.render('user/emptyCart', { user })
  }



  // res.render('user/cart',{user,products})
}

exports.addtocart = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;

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
    console.log(productIndex);

    if (productIndex === -1) {
      // If the product is not in the cart, add it
      userCart.products.push({ productId, quantity: 1 });

    }
    else {
      // If the product is already in the cart, increase its quantity by 1
      userCart.products[productIndex].quantity += 1;

    }

    await userCart.save();


    res.redirect('/products')
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.updateQuantity = async (req, res) => {
  console.log("zndlkvndlnf");
}


// increment quantity 

exports.increase_product = async (req, res) => {
  console.log("ttt");
  const userId = req.session.user
  const cartId = req.body.cartId
  // console.log(cartId);


  try {
    const cart = await cartSchema.findOne({ userId: userId }).populate("products.productId")
    // console.log(cart);


    let cartIndex = cart.products.findIndex(items => items.productId.equals(cartId))

    console.log(cartIndex);

    cart.products[cartIndex].quantity += 1
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

    ;

    const result = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );



    if (result) {
      res.redirect("/cart");

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
  try {
    const data = await usersSchema.findOne({ _id: user })

    res.render('user/add_address', { user, data: data.address })
  }
  catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }


}

//post method
exports.add_address = async (req, res) => {

  try {
    const userId = req.session.user
    const { name, address, phone, zip, city, state } = req.body

    const user = await usersSchema.findOne({ _id: userId })
    console.log(user);
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

    // console.log(address);

    let cart = await cartSchema.findOne({ userId: user }).populate(
      "products.productId"
    )
    if (user) {
      const address = user.address[0];

      res.render('user/check_out', { user, cart, address })
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


exports.orderConfirmation = async (req, res) => {
  if (req.session.user) {
    try {
      const payment = req.body.payment
      const name=req.body.name
      const user = req.session.user
      const userId = req.session.user?._id
      const id = req.params.id
      console.log("yyy");
      console.log(name);
      console.log("yxy");


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
        totalPrice += item.price * item.quantity;
      });

      // will continue
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


      res.render('user/confirmation', { user, userId, specifiedAddress, cart, payment,data,totalPrice })

    } catch (error) {
      console.log(error);
      res.status(500).send("network error")
    }

  } else {
    res.redirect("/login")
  }
}




