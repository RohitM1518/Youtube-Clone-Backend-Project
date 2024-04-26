import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from '../models/subscription.model.js'
import mongoose from "mongoose"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    console.log("Channel Id ",channelId)
    if(!channelId){
        throw new ApiError(404,"No User Such channel exists")
    }
    const user = req.user
    console.log("Requesting User ",user)
    const  subscribed = await Subscription.findOne({channel: new mongoose.Types.ObjectId(channelId),subscriber: user._id})

    if(subscribed){
        await Subscription.deleteOne({channel: new mongoose.Types.ObjectId(channelId),subscriber: user._id})
        return res.status(200).json(new ApiResponse(200,{},"Unsunscribed successfully"))
    }
    if(!subscribed){
        await Subscription.create({channel: new mongoose.Types.ObjectId(channelId),subscriber: user._id})
        return res.status(200).json(new ApiResponse(200,{},"Subscribed successfully"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Trail in toggle subscrption"))    
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(404,"No User with this ChannelID exists")
    }
    const subscribers=await Subscription.find({channel:new mongoose.Types.ObjectId(channelId)})
    
    return res.status(200).json(new ApiResponse(200,subscribers?.length,"Successfully fetched the users who have subscribed to this Channel."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscribedTo= await Subscription.find({subscriber:channelId}).populate("channel",["_id","avatar","username","fullname"]);
    if(!subscribedTo){
        throw new ApiError(500,'Server Error while fetching subscribedTo')
    }
    return res.status(200).json(new ApiResponse(200,subscribedTo,"Successfully fetched all the accounts user subscribed to"))

})

const isChannelSubscribed=asyncHandler(async(req,res)=>{
    const {channelId}=req.query
    console.log("Channel Id ",channelId)
    const user=req.user
    console.log("User Id ",(req.user._id))
    const subscribed = await Subscription.findOne({channel: new mongoose.Types.ObjectId(channelId),subscriber: user._id})
    if(subscribed){
        return res.status(200).json(new ApiResponse(200,{},"Subscribed"))
    }
    return res.status(200).json(new ApiResponse(200,{},"Subscribe"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isChannelSubscribed
}