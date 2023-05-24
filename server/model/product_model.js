const mongoose=require("mongoose")

var productSchema=new mongoose.Schema({

    name:{
        type:String,
        require:true
       
    },
    details:{
        type:String,
        require:true,
       
       
    },
  brand:{
        type:String,
        require:true,
        ref:'category'
    }
    ,
    photo:[{
        type:String,
        require:true,
       
       
    }],
    
    price:{
        type: String,
        require: true
    },

    Blocked:{
        default:false,
        type:Boolean
    }
    
  
})

const Product = new mongoose.model("product",productSchema);


module.exports=Product;