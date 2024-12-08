const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
    },
    postsId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post'
    }]
})



module.exports =  mongoose.model('user',userSchema);