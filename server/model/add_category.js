const mongoose=require("mongoose")

var categorySchema=new mongoose.Schema({

    category :{
        type:String,
        require:true
       
    }

})

const category = new mongoose.model("category",categorySchema);


module.exports=category;