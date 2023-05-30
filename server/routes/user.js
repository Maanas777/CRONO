const express=require('express')
const router= express.Router()
const controller=require('../controller/controller')
const userSchema=require('../model/model')
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
    }else{
        res.redirect('/')
    }
}

const isUserBlocked=async(req,res,next)=>{
    const userId=req.session.user?._id
    const user= await userSchema.findById(userId)
console.log(user,"909");
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



router.get('/',(req,res)=>{
    let user=req.session.user

    res.render('user/index',{user:user})
     
})




router.get('/login',(req,res)=>{
    let user=req.session.user
    res.render('user/login',{user})
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

router.get('/addcart/:id',isUserBlocked,controller.addtocart)
router.get('/cart',isUserBlocked,controller.getCart)
router.post('/increase_product',isUserBlocked,controller.increase_product)
router.post('/decreaseQuantity',isUserBlocked,controller.decreaseQuantity)
router.get('/productRemove/:id',isUserBlocked,controller.remove_product)
router.get('/add_adress',isUserBlocked,controller.address)

router.post('/add_address',isUserBlocked,controller.add_address)
router.get('/checkout/:id',isLoggedIn,isUserBlocked,controller.checkout)

router.post('/order/:id',isUserBlocked,controller.orderConfirmation)
router.get('/order_page',isLoggedIn,isUserBlocked,controller.order_find)
router.get('/cancel_product/:id',isUserBlocked,controller.cancel_product)
router.get('/return_product/:id',controller.return_product)

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
router.get('/wallet_page',controller.getWallet)






module.exports=router