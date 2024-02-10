import mongoose,{Schema} from "mongoose";

const tweetSchema = new Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required: true,
        maxLength:[140,"Your Tweet is too long!"]
    }
},{timestamps:true})

export const Tweet = mongoose.model("Tweet",tweetSchema) //In mongodb "Tweet" will be saved as "tweets"