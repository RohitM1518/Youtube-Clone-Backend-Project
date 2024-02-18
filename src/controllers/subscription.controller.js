import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from '../models/subscription.model.js'
import { getuserbyusername } from "../utils/getuserbyusername.middleware.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelname} = req.params
    const channel = await getuserbyusername(channelname)
    if(channel===null){
        throw new ApiError(404,"No User with this username exists")
    }
    const user = req.user

    const  subscribed = await Subscription.findOne({channel: user._id,subscriber: channel._id})

    if(subscribed){
        await Subscription.deleteOne({channel: user._id,subscriber: channel._id})
        return res.status(200).json(new ApiResponse(200,{},"Unsunscribed successfully"))
    }
    if(!subscribed){
        await Subscription.create({channel:channel._id, subscriber:user._id})
        return res.status(200).json(new ApiResponse(200,{},"Subscribed successfully"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Trail in toggle subscrption"))    
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channel = await getuserbyusername(req.params.channelname)
    if(channel===null){
        throw new ApiError(404,"No User with this username exists")
    }
    const subscribers=await Subscription.find({channel:channel._id})
    
    return res.status(200).json(new ApiResponse(200,subscribers?.length,"Successfully fetched the users who have subscribed to this Channel."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const { subscriberId } = req.params
    const subscribedTo= await Subscription.find({subscriber:req.user._id}).populate("channel",["_id","profilepic","username"]);
    if(!subscribedTo){
        throw new ApiError(500,'Server Error while fetching subscribedTo')
    }
    return res.status(200).json(new ApiResponse(200,subscribedTo.length,"Successfully fetched all the accounts user subscribed to"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}