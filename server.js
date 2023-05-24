
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



app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname,'public')))

app.use(express.static("uploads"));

app.use(session({
    
  secret:"my_secret_key",
  resave:false,
  saveUninitialized:false,
  cookie:{secure:false} 
}))




  app.use(bodyparser.urlencoded({extended:false}))
  
  app.use(nocache())
  app.use(userRouter)
 app.use(adminRouter)




app.listen(3002,()=>{
    console.log('server started in http://localhost:3002 !!');
  })
