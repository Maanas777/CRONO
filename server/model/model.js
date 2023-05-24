const mongoose=require("mongoose")

var usersSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
       
    },
    username:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
       
       
    },
    phone:{
        type:Number,
        require:true,
       
       
    },
    
    password:{
        type:String,
        require:true,
       
       
    },

    address:[{
        name:String,
       state:String,
         city:String,
        zip:Number,
         phone:Number
     
        }],
    
    isBlocked:{
        default:false,
        type:Boolean
    }

  
})


const User = new mongoose.model("users",usersSchema);

module.exports=User;