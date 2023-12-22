import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema = new mongoose.Schema(
    {
    title:{
        type:String,
        required:true
    },
    videoFile:{
        type:String, //Video comes from cloudinary and saved as url
        required:true,

    },
    thumbnail:{
        type:String, //Photo comes from cloudinary and saved as url
        required:true,
    },
    description:{
        type:String, 
        required:true,
    },
    duration:{
        type:Number, //From clodnery url we can extract duration of a video
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const User = mongoose.Model("Video",videoSchema)