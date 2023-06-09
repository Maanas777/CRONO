
const categorySchema = require("../model/add_category");
const usersSchema = require('../model/model')
const cartSchema = require('../model/cart_model')
const productSchema = require('../model/product_model')
const orderSchema = require('../model/order')
const couponSchema = require('../model/coupon')
const bannerSchema= require('../model/banner')
const walletSchema = require('../model/wallet')
const multer = require('multer');
const fs = require("fs");
const { log } = require("console");
const session=require("express-session")



exports.
  adminlogin = (req, res) => {
   req.session.admin=true
    const email = req.body.email
    const password = req.body.password

    try {
      if (email == "admin@gmail.com") {
        if (password == 123) {
          req.session.admin = { email: email };
          res.redirect('/admin_index')
        }

        else {
          res.render("admin/login", { alert: "Invalid password" })
        }
      } else {
        res.render("admin/login", { message: "Invalid email" })
      }
    }
    catch (error) {
      console.error(error);
      res.send("An error occured")
    }
  }


exports.dashboard= async (req,res)=>{
  
const admin=req.session.admin
  const today = new Date().toISOString().split("T")[0];
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);


  const todaySales= await orderSchema.countDocuments({
    createdAt:{$gte:startOfDay,$lt:endOfDay},
    status:"Delivered"
  }).exec();

  console.log(todaySales,"sale");

  const totalSale= await orderSchema.countDocuments({status:"Delivered"})

const todayRevenue= await orderSchema.aggregate([
  {$match:{createdAt: {$gte:startOfDay,$lte:endOfDay},
 status:"Delivered"
}
},

{ $group: { _id: null, totalRevenue: { $sum: "$total" } } },

])

const salesCountByMonth = await orderSchema.aggregate([
  {
    $match: {
      status: "Delivered",
    },
  },
  {
    $group: {
      _id: {
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
      },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      month: "$_id.month",
      year: "$_id.year",
      count: 1,
    },
  },
]);

console.log(salesCountByMonth);

const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;

const TotalRevenue = await orderSchema.aggregate([
  {
    $match: { status: "Delivered" },
  },
  { $group: { _id: null, Revenue: { $sum: "$total" } } },
]);



const total_users= await usersSchema.countDocuments()


const total_orders= await orderSchema.countDocuments()

const refunded= await orderSchema.countDocuments({status:"Refunded Amount"})

const delivered= await orderSchema.countDocuments({status:"Delivered"})

const Pending= await orderSchema.countDocuments({status:"Pending"})

const returned= await orderSchema.countDocuments({status:"Returned"})

const Cancelled= await orderSchema.countDocuments({status:"Cancelled"})







res.render('admin/admin_index',{todaySales,
  totalSale,
  revenue,
  TotalRevenue,
  total_users,
  total_orders,
  refunded,
  delivered,
  Pending,
  returned,
  Cancelled,salesCountByMonth})


}



//get add product page 

exports.addproductpage = async (req, res) => {
  try {
    const data = await categorySchema.find()

    res.render('admin/add_product', { data });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};




// get products

exports.find_product = async (req, res) => {
  try {
    const product_data = await productSchema.find().exec();
    const category_find = await categorySchema.find()

    // console.log(category_find);

    res.render("admin/admin_products", {
      product_data,
      category_find,
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};




exports.addProduct = async (req, res) => {

  try {
    const product = new productSchema({
      name: req.body.name,
      price: req.body.price,
      details: req.body.details,
      brand: req.body.brand,
      stock: req.body.stock,
      photo: req.files.map((file) => file.filename)
      
    });

     await product.save();

    res.redirect('admin_products');
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message || 'Some error occurred'
    });
  }
};



//get update product page
exports.edit_product_page = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await productSchema.findById(id);
    const category = await categorySchema.find()


    if (!user) {
      return res.redirect('/admin_products');
    }
    // console.log(user);
    return res.render('admin/update_product', { user, category });
  } catch (err) {
    console.error(err);
    return res.redirect('/admin_products');
  }
};


//update product
// exports.updateproduct = async (req, res) => {

//   try {
//     const id = req.params.id.trim();
//     // const { id } = req.params;
//     let new_image = "";
//     if (req.file) {
//       new_image = req.file.filename;
//       try {
//         fs.unlinkSync("./uploads/" + req.body.photo);
//       } catch (error) {
//         console.log(error);
//       }
//     } else {
//       new_image = req.body.photo;
//     }


// //     // Update the product using findByIdAndUpdate
//     const updatedProduct = await productSchema.findByIdAndUpdate(
//       id,
//       {

//         name: req.body.name,
//         price: req.body.price,
//         details: req.body.details,
//         photo: new_image,
//         brand: req.body.brand
//       },

//       { new: true }

//     );


//     // Set { new: true } to return the updated document
//     console.log(req.body);
//   if (updatedProduct) {

//     res.redirect("/admin_products");
//   } else {

// } catch (error) {
//   console.error(error);
//   res.send(error);
// }


// }


exports.updateproduct = async (req, res) => {

  try {
    const { id } = req.params;



    let new_images = [];
    if (req.files && req.files.length > 0) {
      new_images = req.files.map(file => file.filename);

      try {
        if (req.body.photo && Array.isArray(req.body.photo)) {
          req.body.photo.forEach((photo) => {
            fs.unlinkSync("./uploads/" + photo);
          });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      new_images = req.body.photo;
    }


    const category = await categorySchema.findOne({ category: req.body.brand });
    const categoryId = category ? category._id : null;
    console.log(categoryId, "9090");


    const updatedProduct = await productSchema.findByIdAndUpdate(
      id.trim(),
      {
        name: req.body.name,
        price: req.body.price,
        details: req.body.details,
        photo: new_images,
        brand: req.body.brand,
        stock:req.body.stock,
      
      },

      { new: true }
   

    );


    if (updatedProduct) {

      res.redirect("/admin_products");
    } else {
      // Product not found

      res.redirect("/admin_products");
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }

}



// delete product


exports.block_product = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await productSchema.findByIdAndUpdate(id, { Blocked: true });
    res.redirect('/admin_products');
  } catch (error) {
    // Handle any errors that occurred during the update process
    console.error(error);
    res.status(500).send('An error occurred while blocking the product.');
  }
};


//unblock product

exports.unblock_product = async (req, res) => {
  try {
    const id = req.params.id
    const result = await productSchema.findByIdAndUpdate(id, { Blocked: false });
    res.redirect('/admin_products');
  } catch (error) {
    // Handle any errors that occurred during the update process
    console.error(error);
    res.status(500).send('An error occurred while blocking the product.');
  }
}



//add category

exports.addcategory = async (req, res) => {
  try {
    const existingCategory = await categorySchema.findOne({ category: req.body.category });

    if (existingCategory) {
      return res.send('<script>alert("Category already exists"); window.location.href = "/admin_products";</script>');
    }
    const user = new categorySchema({
      category: req.body.category,
      // description:req.body.description
    })
    const data = await user.save();
    res.redirect('/admin_products')
  }
  catch (err) {
    console.log(err);
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  }

}

//find category


exports.find_category = async (req, res) => {
  try {
    const category_find = await categorySchema.find().exec();
    // console.log(category_find);


    res.render("admin/admin_products", {

      category_find: category_find,

    });

  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};




//to get edit category  page

exports.edit_category = async (req, res) => {
  try {
    let id = req.params.id
    let user = await categorySchema.findById(id)
    if (!user) {
      res.redirect('/admin_products');
    } else {
      res.render('admin/edit_category', { user })
    }
  } catch (err) {
    res.redirect('/admin_products')
    console.log(err); // log the error for debugging purposes}
  }
}


//update category

exports.update_category = async (req, res) => {
  const id = req.params.id

  const update_cat = await categorySchema.findByIdAndUpdate(id, {
    category: req.body.category

  })

  if (update_cat) {
    res.redirect('/admin_products')
  }

  // .then(()=>{
  //   res.redirect("/products")
  // }).catch((error)=>{
  //   res.send(error);
  // })
}

//delete category

exports.deletecategory = async (req, res) => {
  try {
    const id = req.params.id
    const result = await categorySchema.findByIdAndRemove(id);

    if (result) {
      res.redirect('/admin_products')
    }
    else {
      res.redirect('/admin_products')
    }
  }
  catch (err) {
    res.status(500).send(err.message);
  }
}

//find_user

exports.find_user = async (req, res) => {
  try {
    const user_data = await usersSchema.find().exec()

    res.render("admin/show_user", { user_data: user_data })
  }
  catch (error) {
    console.log(error);
    res.send({ message: error.message })
  }
}


//block user

exports.block_user = (req, res) => {
  const id = req.params.id

  usersSchema.findByIdAndUpdate(id, {
    isBlocked: true,
  }, { new: true })
    .then((updatedUser) => {
      res.redirect('/find_user');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user.");
    });
};

exports.unblock_user = (req, res) => {
  const id = req.params.id
  usersSchema.findByIdAndUpdate(id, {
    isBlocked: false,
  }, { new: true })
    .then((updatedUser) => {
      res.redirect('/find_user');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user.");
    });
}


exports.search_product = async (req, res) => {
  const search = req.body.search;
  try {
    const regex = new RegExp(search, 'i');
    const product_data = await productSchema.find({ name: regex });
    const category_find = await categorySchema.find().exec();

    res.render('admin/admin_products', { product_data, category_find })
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while searching for products.' });
  }

};

exports.order_find = async (req, res) => {
  const order = await orderSchema.find().populate('user').populate('items.product');
  
  res.render('admin/orders', { order })

}




exports.update_status = async (req, res) => {

  try {
    const id = req.params.id

    const order = await orderSchema.findByIdAndUpdate(id, {
      status: req.body.status
    }, { new: true })

    console.log(order);

    res.redirect("/admin_order")

  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error")
  }
}

// to get coupon page with data
exports.coupon_page = async (req, res) => {
  let user = req.session.user
  try {
    const coupon_data = await couponSchema.find()

    res.render('admin/coupon', { user, coupon_data })
  }
  catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
}



// get method to add coupon page
exports.add_coupon_page = (req, res) => {

  res.render('admin/add_coupon')
}


//post method
exports.add_coupon = async (req, res) => {

  try {
    const data = await couponSchema({
      code: req.body.coupon_code,
      date: req.body.date,
      discount: req.body.discount,


    })
    const coupon = await data.save()

    res.redirect('add_coupon_page');
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message || 'Some error occurred'
    });
  }

}


//deactivate coupon

exports.deactivate_coupon = async (req, res) => {

  try {
    const id = req.params.id

    await couponSchema.findByIdAndUpdate(id, {
      status: false
    }, { new: true })
    res.redirect('/coupon_page')

  } catch (error) {
    console.error(error);
    res.status(500).send("failed to Deactivate coupon.");
  };
}


//activate coupon
exports.activate_coupon = async (req, res) => {
  try {
    const id = req.params.id

    await couponSchema.findByIdAndUpdate(id, {
      status: true
    }, { new: true })
    res.redirect('/coupon_page')

  } catch (error) {
    console.error(error);
    res.status(500).send("failed to Activate coupon.");
  };
}

//edit coupon
exports.edit_coupon = async (req, res) => {
  try {
    const id = req.params.id
    const editedCoupon = await couponSchema.findByIdAndUpdate(id, {

      code: req.body.coupon_code,
      date: req.body.date,
      discount: req.body.discount

    }, { new: true })

    if (editedCoupon) {

      res.redirect("/coupon_page");

    } else {
      res.send(err)
    }

  } catch (error) {
    console.error(error);
    res.send(error);
  }
}



exports.userRefund = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderSchema.findById(id).populate({ path: "items.product" });
    console.log(order.payment_method);

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const wallet = await walletSchema.findOne({ userId: order.user });

    if (wallet) {
      // User's wallet already exists, update the balance
      wallet.balance += order.total;

      wallet.transactions.push(order.payment_method);
      console.log(wallet, "hdh");

      await wallet.save();
    } else {
      // User's wallet does not exist, create a new wallet
      const newWallet = new walletSchema({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method]
      });

      await newWallet.save();
    }

    await orderSchema.updateOne({ _id: id }, { $set: { status: 'Refunded Amount' } });

    res.redirect('/admin_order');
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};


exports.Banner=async(req,res)=>{
    const admin=req.session.admin
    const Banner_data=await bannerSchema.find().exec()
    res.render('admin/banner',{admin,Banner_data})
  }
  exports.AddBanner=async(req,res)=>{
    const admin=req.session.admin
    res.render('admin/addBanner',{admin})
  }
  exports.ADDBanner=async(req,res)=>{
    try {
      const Banner = new bannerSchema({
        name: req.body.name,
        photo: req.files.map((file) => file.filename),
        date:req.body.date,
      });
      console.log(Banner);
      await Banner.save();
  
      const Banner_data=await bannerSchema.find().exec()
      res.render('admin/banner',{Banner_data})
    } catch (error) {
      console.log(error);
    }
   
  }

  exports.activateBanner = async (req, res) => {
    try {
      const id = req.params.id;
      await bannerSchema.findByIdAndUpdate(
        id,
        {
          status: true
        },
        { new: true }
      );
      res.redirect('/banner');
    } catch (error) {
      console.log(error);
    }
  };

  exports.deactivatebanner=async(req,res)=>{
    try {
      const id = req.params.id;
      await bannerSchema.findByIdAndUpdate(
        id,
        {
          status: false
        },
        { new: true }
      );
      res.redirect('/banner');
    } catch (error) {
      console.log(error);
    }
  };



  
  



  exports.SalesReport=async(req,res)=>{
    const admin=req.session.admin
    const filteredOrders=await orderSchema.find().populate("user").populate("items.product").populate("address")
   console.log(filteredOrders,"popopo");
    res.render("admin/sales_report",{admin,filteredOrders})
  }

  exports.FilterbyDates=async(req,res)=>{
    const admin=req.session.admin
    const FromDate=req.body.fromdate
    console.log(FromDate);
    const Todate=req.body.todate
    console.log(Todate);
    const filteredOrders=await orderSchema.find({createdAt:{$gte:FromDate,$lte:Todate}}).populate("user").populate("items.product").populate("address")
   
    res.render("admin/sales_report",{admin,filteredOrders})
  }