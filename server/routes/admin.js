const express=require('express')
const router=express.Router()
const admincontoller=require('../controller/admin_controller')
const multer=require('multer')
const fs=require('fs')
const category=require('../model/add_category')
const path=require('path')





var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // make sure directory exists
    if (!fs.existsSync("./uploads")) {
      fs.mkdirSync("./uploads");
    }
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // remove spaces and special characters from original filename
    var originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
    // set filename to fieldname + current date + original filename
    cb(null, file.fieldname + "_" + Date.now() + "_" + originalname);
  },
});
var upload = multer({
  storage: storage,
}).array('photo',10)




router.get('/admin',(req,res)=>{
    res.render('admin/login')
})


// router.get('/products',((req,res)=>{
//     res.render('admin/products')
// }))

router.get("/add_products", async (req, res) => {
  const data = await category.find().exec();
  res.render("admin/add_product", { data});
});

router.get("/add_category",(req,res)=>{
  res.render('admin/add_category')
})

router.get('/users',(req,res)=>{
  res.render('admin/show_user')
})

router.get('/admin_index',admincontoller.dashboard)

router.post("/admin",admincontoller.adminlogin);
router.post('/add_product',upload,admincontoller.addProduct);

// router.get("/add_product_page", admincontoller.addproductpage)

router.get('/admin_products',admincontoller.find_product)
router.get("/edit_pdt/:id",admincontoller.edit_product_page)
router.post("/update_product/:id", upload, admincontoller.updateproduct);

router.get("/block_pdt/:id",admincontoller.block_product)
router.get("/unblock_product/:id",admincontoller.unblock_product)
router.post("/add_category",admincontoller.addcategory)
router.get("/category",admincontoller.find_category)
router.get("/edit_category/:id",admincontoller.edit_category)
router.post("/update_category/:id",admincontoller.update_category)
router.get("/delete_category/:id",admincontoller.deletecategory)
router.get("/find_user",admincontoller.find_user)
router.get("/block_user/:id",admincontoller.block_user)
router.get("/unblock_user/:id",admincontoller.unblock_user)
router.post("/search_product",admincontoller.search_product)
router.get("/admin_order",admincontoller.order_find)
router.post("/edit_status/:id",admincontoller.update_status)


//coupon
router.get('/coupon_page',admincontoller.coupon_page)
router.get('/add_coupon_page',admincontoller.add_coupon_page)
router.post('/add_coupon',admincontoller.add_coupon)
router.get('/deactivate_coupon/:id',admincontoller.deactivate_coupon)
router.get('/activate_coupon/:id',admincontoller.activate_coupon)
router.post('/edit_coupon/:id',admincontoller.edit_coupon)


//wallet
router.get('/userRefund/:id',admincontoller.userRefund)



module.exports=router
