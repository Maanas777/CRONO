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
        type: Number,
        require: true
    },

    Blocked:{
        default:false,
        type:Boolean
    },
    stock:{
        type:Number,
        required:true
    }
    
  
})

const Product = new mongoose.model("product",productSchema);


module.exports=Product;