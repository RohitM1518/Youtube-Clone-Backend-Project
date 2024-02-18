import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { positiveWords,negativeWords } from "../utils/wordList.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }

    const totalVideos = await Video.countDocuments({ owner: userId })

    let totalSubscribers = await Subscription.countDocuments({ channel: userId })


    const totalViewsandMostView = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort:{
                views : -1
            }
        },
        {
            $group: {
                _id: null,
                mostView:{$max: "$views"},
                totalViews: { $sum: "$views" },
                mostViewedVideo: { $first: "$$ROOT" },
            }
        }
    ])


    const likesPerVideo = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                _id: null,
                totalLikes: { $size: "$likes"  }
            }
        }

    ])


    const likesPerTweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: { $size: "$likes" }
            }
        },
        
    ])

    const commentsPerVideo = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $project:{
                totalComments:{$size: "$comments"}
            }
        },
        
    ])

    let totalComments =0;
    commentsPerVideo?.map((video)=>{
        totalComments += video.totalComments
    })

    let totalLikesOnVideo=0;
    likesPerVideo?.map((video)=>{
        totalLikesOnVideo += video.totalLikes
    })

    let totalLikesOnTweet =0;
    likesPerTweet?.map((tweet)=>{
        totalLikesOnTweet += tweet.totalLikes
    })

    

    const engagementRate = ((totalLikesOnVideo + totalLikesOnTweet + totalComments) /( totalSubscribers<=0 ? 1:totalSubscribers)) * 100;
    const avgViewsPerVideo = totalViewsandMostView[0]?.totalViews / (totalVideos<=0 ? 1:totalVideos) || 0 ;

    const positiveComments = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments",
            }
        },
        {
            $unwind: "$comments"
        },
        {
            $match:{
                $or:[
                    {'comments.content':{$regex: new RegExp(positiveWords.join('|'),'i')}},
                ]
            }
        },
        {
            $project:{
                _id:1,
                title:1,
                thumbnail:1,
                commentId:"$comments._id",
                content:"$comments.content"
            }
        }
    ])
    const negativeComments = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments",
            }
        },
        {
            $unwind: "$comments"
        },
        {
            $match:{
                $or:[
                    {'comments.content':{$regex: new RegExp(negativeWords.join('|'),'i')}},
                ]
            }
        },
        {
            $project:{
                _id:1,
                title:1,
                thumbnail:1,
                commentId:"$comments._id",
                content:"$comments.content"
            }
        }
    ])

    let sentiment;
    if(positiveComments.length>negativeComments.length){
        sentiment = "Positive"
    }
    else if(positiveComments.length<negativeComments.length){
        sentiment = "Negative"
    }
    else{
        sentiment = "Neutral"
    }
    const totalPositiveComments=positiveComments.length;
    const totalNegativeComments=negativeComments.length;
    
    return res
            .status(200)
            .json(new ApiResponse(true, {  
                totalVideos, 
                totalSubscribers, 
                totalViewsandMostView , 
                commentsPerVideo,
                likesPerVideo,
                likesPerTweet,
                totalComments,
                totalLikesOnTweet,
                totalLikesOnVideo,
                engagementRate,
                avgViewsPerVideo,
                positiveComments,
                negativeComments,
                sentiment,
                totalPositiveComments,
                totalNegativeComments }, "Channel Stats"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }
    let { limit = 10, page = 1, sortBy = 'createdAt', sortType = 'desc' } = req.query;

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }
    const skip = (page - 1) * limit

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {   $sort: {
            [sortBy]: sortType = "desc" ? 1 : -1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            coverImage: 1,
                        }
                    }
                ]
            }
        }
    ])
    if (!videos) {
        throw new ApiError(404, 'No Videos Found')
    }

    const totalVideos = videos.length
    const totalPages = Math.ceil(totalVideos / limit)

    res.status(200).json(new ApiResponse(true, { videos, totalVideos, totalPages, currentPage: page }))

})

export {
    getChannelStats,
    getChannelVideos
}