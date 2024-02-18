import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { Tweet } from '../models/tweet.model.js'
import { ApiResponse } from "../utils/ApiResponse.js"


const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if (!content || typeof content !== 'string') throw new ApiError(400,"Content is required");
    
    const tweet = await Tweet.create(
        {
            content,
            owner:req.user?._id
        }
    )
    if(!tweet) throw new ApiError(500, "Server Error while creating tweet")

    return res.status(200).json(new ApiResponse(200,tweet,"Tweet is created successfully"))
})

const updateTweet = asyncHandler(async(req,res)=>{
    const {content}=req.body;
    const tweet=await Tweet.findOneAndUpdate({_id:req.params.id,owner:req.user?._id},{
        $set:{
            content:content
        }
    },{new:true})

if(!tweet){
    throw new ApiError(500,'Something went wrong while updating tweet');
}
return res
.status(200)
.json(
    new ApiResponse(200,tweet,"Tweet has been updated succesfully.")
)
})

const getUserTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.find({ owner: req.user._id });

    if (tweets.length === 0) {
        throw new ApiError(404, "No Tweets Found!");
    }

    return res.status(200).json(new ApiResponse(200, tweets.reverse(), 'Tweets fetched Successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!tweetId) throw new ApiError(400, "Invalid request to delete tweet");
    const tweet=await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });
    if(!tweet){
        throw new ApiError(500, "Something went wrong while deleting tweet.");
    }
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});




export{
    createTweet,
    updateTweet,
    getUserTweets,
    deleteTweet
}