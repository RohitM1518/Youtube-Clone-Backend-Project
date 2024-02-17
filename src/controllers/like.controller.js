import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid request to like video")
    }
    
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404, "Video not found")

    const like = await Like.findOne({likedBy:req.user._id, video:videoId})
    console.log("Like  is ",like);
    if(like){
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(new ApiResponse(200, null, "Video is unliked successfully"))
    }
    else{
        await Like.create({likedBy:req.user._id, video:videoId})
        return res.status(201).json(new ApiResponse(201, null, "Video is liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid request to like comment")
    }
    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(404, "Comment not found")

    const like = await Like.findOne({likedBy:req.user._id, comment:commentId})

    if(like){
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(new ApiResponse(200, null, "Comment is unliked successfully"))
    }
    else{
        await Like.create({likedBy:req.user._id, comment:commentId})
        return res.status(201).json(new ApiResponse(201, null, "Comment is liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid request to like tweet")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404, "Tweet not found")

    const like = await Like.findOne({likedBy:req.user._id, tweet:tweetId})

    if(like){
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(new ApiResponse(200, null, "Tweet is unliked successfully"))
    }
    else{
        await Like.create({likedBy:req.user._id, tweet:tweetId})
        return res.status(201).json(new ApiResponse(201, null, "Tweet is liked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    if(page < 1) throw new ApiError(400, "Invalid page number")
    if(limit < 1) throw new ApiError(400, "Invalid limit")

    const skip = (page - 1) * limit
    const pipeline=[
        {
            $match:{
                likedBy:req.user._id
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $skip:skip
        },
        {
            $limit:limit
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"likedBy",
                            foreignField:"_id",
                            as:"likedBy",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$video"
        },
        {
            $project:{
                _id:0,
                video:{
                    _id:1,
                    title:1,
                    description:1,
                    thumbnail:1,
                    createdAt:1,
                    likedBy:1
                }
            }
        }
]

const likedVideos = await Like.aggregate(pipeline)
if(!likedVideos) throw new ApiError(500, "Something went wrong while fetching liked videos")

res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos are fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}