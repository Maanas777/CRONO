const express=require('express')
const router= express.Router()
const controller=require('../controller/controller')
const userSchema=require('../model/model')
const bannerSchema=require('../model/banner')
const categorySchema=require('../model/add_category')
const productSchema=require('../model/product_model')
// const session=require('express-session')


const isLogged=(req,res,next)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        next()
    }
}
const isLoggedIn=(req,res,next)=>{
    if(req.session.user){
       
        next()

    }
    else{
        console.log("haiii");
        res.redirect('/login')
        
    }
}






const isUserBlocked=async(req,res,next)=>{
    const userId=req.session.user?._id
    const user= await userSchema.findById(userId)
    if(user.isBlocked){
        req.session.save(() => {
            req.session.user=false
            res.redirect('/login'); 
         })
         return

    }else{
      next()
    }
}



router.get('/', async (req, res) => {
    let user = req.session.user;
    const banner = await bannerSchema.find();
    
    const category = await categorySchema.find();

    res.render('user/index', { user: user ,banner,category});
  });
  
//   router.get('/specific/:id', async (req, res) => {
//     let user = req.session.user;
//     const id = req.params.id;
   
//     const category = await categorySchema.findOne({ _id: id });
//     const product = await productSchema.find({ brand: category.category });
//     console.log('ss', product);
//     res.render("user/shop", { product, user,category });
//   });
  
  




router.get('/login',(req,res)=>{
    let user=req.session.user
    res.render('user/login',{user})
} 
)

router.get('/signup',(req,res)=>{
    let user=req.session.user
   res.render('user/signup',{user})
} 
)
router.get('/otp',(req,res)=>{
    res.render('user/otp_login')
  })
// router.get('/cart',(req,res)=>{

//     let user=req.session.user
//     res.render('user/cart',{user:user})
// })




router.post('/signup',controller.create)
router.post('/login',controller.find_user)
router.get('/logout',controller.logout)

router.get('/products',controller.show_product)
router.get('/filter_category/:id',controller.filter_category)
router.get('/single_pro/:id',controller.single_products)

router.get('/addcart/:id',isLoggedIn,isUserBlocked,controller.addtocart)
router.get('/cart',isLoggedIn,isUserBlocked,controller.getCart)
router.post('/increase_product',isUserBlocked,controller.increase_product)
router.post('/decreaseQuantity',isUserBlocked,controller.decreaseQuantity)
router.get('/productRemove/:id',isUserBlocked,controller.remove_product)
router.get('/add_adress',isUserBlocked,controller.address)

router.post('/add_address',isUserBlocked,controller.add_address)
router.get('/checkout/:id',isLoggedIn,isUserBlocked,controller.checkout)

//order
router.post('/order/:id',isUserBlocked,controller.orderConfirmation)
router.get('/order_page',isLoggedIn,isUserBlocked,controller.order_find)
router.post('/cancel_product/:id',controller.cancel_product)
router.post('/return_product/:id',controller.return_product)
router.get('/view_order/:id',controller.view_order)
router.get('/invoice/:id',controller.invoice)

//forgot password
router.get('/forgot_otp',controller.otp_page)
router.post('/sendOtp',controller.sendotp)
router.post('/verifyOtp',controller.verifyotp)
router.post('/verify_password',controller.forgot_password)


//paypal
router.get('/paypal-success',controller.paypal_success)
router.get('/paypal-success',controller.paypal_err)

//coupon
router.post('/redeem_coupon',controller.redeem_coupon)

//wallet
router.get('/wallet_page',isLoggedIn,controller.Wallet)
router.post('/wallet_buy',controller.wallet_buy)

//search product
router.post('/search_product',controller.search_product)

//user profile
router.get('/profile/:id',controller.user_profile)
router.get('/address',controller.address)





module.exports=router