const mongoose = require('mongoose');


const postSchema =  mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    blogImage:{
        type:String,
        required:false
    }
})



module.exports =  mongoose.model('post',postSchema);