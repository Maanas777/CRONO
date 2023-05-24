
const categorySchema = require("../model/add_category");
const usersSchema = require('../model/model')
const cartSchema=require('../model/cart_model')
const productSchema = require('../model/product_model')
const orderSchema= require('../model/order')
const multer = require('multer');

const fs = require("fs");


exports.
  adminlogin = (req, res) => {
    console.log(req.body);
    const email = req.body.email
    const password = req.body.password

    try {
      if (email == "admin@gmail.com") {
        if (password == 123) {
          res.render('admin/admin_index')
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
      photo: req.files.map((file) => file.filename)
    });
    console.log(product);

    const data = await product.save();

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
exports.updateproduct = async (req, res) => {

  try {
    const id = req.params.id.trim();
    // const { id } = req.params;
    let new_image = "";
    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.photo);
      } catch (error) {
        console.log(error);
      }
    } else {
      new_image = req.body.photo;
    }


    // Update the product using findByIdAndUpdate
    const updatedProduct = await productSchema.findByIdAndUpdate(
      id,
      {

        name: req.body.name,
        price: req.body.price,
        details: req.body.details,
        photo: new_image,
        brand: req.body.brand
      },

      { new: true }

    );


    // Set { new: true } to return the updated document
    console.log(req.body);
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

exports.  addcategory = async (req, res) => {
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
    
  res.render('admin/admin_products',{product_data,category_find})
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while searching for products.' });
  }
 
};

exports.order_find= async(req,res)=>{
  const order= await orderSchema.find().populate('user').populate('items.product');
  console.log("565");
  console.log(order);
  console.log("5(5");
  res.render('admin/orders',{order})

}


exports.update_status =async(req,res)=>{

    try {
        const id = req.params.id
        const orderStatus = req.body.status
        const order = await orderSchema.findByIdAndUpdate(id,{
          status:orderStatus
        },{ new: true })

        console.log(order);

        res.redirect("/admin_order")

    } catch (error) {
        console.log(error);
        res.status(501).send("Server Error")
    }
}
