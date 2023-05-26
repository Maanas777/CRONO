
require("dotenv").config()
const express = require('express');
const app = express();
const nocache=require('nocache')
const session=require('express-session')
const bodyparser=require('body-parser')
const path = require('path')
const userRouter=require('./server/routes/user')
const adminRouter=require('./server/routes/admin')
const  connection=require('./server/connection/connection')
const Swal = require('sweetalert2');
const cors=require('cors')

const paypal=require('paypal-rest-sdk')

require("dotenv").config();

app.set('view engine', 'ejs');


const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;


app.use(express.static(path.join(__dirname,'public')))

app.use(express.static("uploads"));
app.use(cors())

app.use(session({
    
  secret:"my_secret_key",
  resave:false,
  saveUninitialized:false,
  cookie:{secure:false} 
}))


paypal.configure({
  'mode':'sandbox',
  'client_id':PAYPAL_CLIENT_ID,
  'client_secret':PAYPAL_CLIENT_SECRET
  
})

  app.use(bodyparser.urlencoded({extended:false}))
  
  app.use(nocache())
  app.use(userRouter)
 app.use(adminRouter)




app.listen(3002,()=>{
    console.log('server started in http://localhost:3002 !!');
  })
