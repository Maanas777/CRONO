const express=require('express')
const router= express.Router()
const controller=require('../controller/controller')
const session=require('express-session')

// router.use(session({
//     secret: 'your-secret-key', // Replace with your own secret key
//     resave: false,
//     saveUninitialized: true
//   }));



router.get('/',(req,res)=>{
    let user=req.session.user
    res.render('user/index',{user:user})
    console.log(user);   
})




router.get('/login',(req,res)=>{
    res.render('user/login')
} 
)

router.get('/signup',(req,res)=>{
   res.render('user/signup')
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
router.get('/single_pro/:id',controller.single_products)
router.post('/sendOtp',controller.sendotp)
router.post('/verifyOtp',controller.verifyotp)
router.get('/addcart/:id',controller.addtocart)
router.get('/cart',controller.getCart)
router.post('/increase_product',controller.increase_product)
router.post('/decreaseQuantity',controller.decreaseQuantity)
router.get('/productRemove/:id',controller.remove_product)
router.get('/add_adress',controller.address)
router.post('/add_address',controller.add_address)
router.get('/checkout/:id',controller.checkout)
router.post('/order/:id',controller.orderConfirmation)


// router.get('/find_cart',controller)










module.exports=router