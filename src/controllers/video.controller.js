import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { getuserbyusername } from '../utils/getuserbyusername.middleware.js'


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, username } = req.query
    //TODO: get all videos based on query, sort, pagination
    if (page < 1) throw new ApiError(400, "Invalid page number")
    if (limit < 1) throw new ApiError(400, "Invalid limit")
    if (sortBy && !["title", "createdAt", "views"].includes(sortBy)) throw new ApiError(400, "Invalid sortBy")
    if (!sortType || ["asc", "desc"].indexOf(sortType) === -1) throw new ApiError(400, "Invalid sortType")
    if (!query && !username) throw new ApiError(400, "Query or Username is required")

    // const user = await getuserbyusername(username)
    // const testRegex = new RegExp(username, 'i');
    // console.log(testRegex.test('hey')); // Should return true for a match

        let pipelineToFindUsingTitleAndDescription=[
            {
            $match:{
                $or:[
                    {title:{$regex: new RegExp(query,'i')}},
                    {description:{$regex: new RegExp(query,'i')}},
                ]
            }
            },
            {
                $sort:{
                    [sortBy]: sortType === 'desc'? -1:1
                }
            },
            {
                $skip : (page-1)*parseInt(limit)
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as:"users"
                }
            },      
    ]

        let pipelineToFindUsingUsername = [
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "users",
                }
            },
            {
                $match:{
                    $or:[
                        {'users.username':{$regex: new RegExp(username,'i')}},
                    ]
                }
            },
            {
                $sort:{
                    [sortBy]: sortType === 'desc'? -1:1
                }
            },
            {
                $skip : (page-1)*parseInt(limit)
            },
            {
                $limit: parseInt(limit)
            }
        ]
     var pipeline;
    if(username){
        pipeline = pipelineToFindUsingUsername
    }
    else{
        pipeline = pipelineToFindUsingTitleAndDescription
    }


    const videos = await Video.aggregate(pipeline)

    if (!videos) {
        throw new ApiError(500, "No Videos found")
    }

    res.status(200).json(new ApiResponse(200, { videos }, "Videos fetched Successfully"))






})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) throw new ApiError(400, "Title and description is needed")

    const videofileLocalpath = req.files?.videoFile[0]?.path
    const thumbnailLocalpath = req.files?.thumbnail[0]?.path
    if (!videofileLocalpath && !thumbnailLocalpath) throw new ApiError(422, 'No file uploaded')

    const videofileURL = await uploadOnCloudinary(videofileLocalpath)
    //console.log("Video File URL",videofileURL)
    const thumbnailURL = await uploadOnCloudinary(thumbnailLocalpath)

    if (!thumbnailURL) {
        throw new ApiError(503, 'Thumbnail could not be uploaded at the moment')
    }
    if (!videofileURL) {
        throw new ApiError(503, 'Video could not be uploaded at the moment')
    }
    const publishedVideo = await Video.create({
        title,
        description,
        videoFile: videofileURL?.url,
        thumbnail: thumbnailURL?.url,
        owner: req.user._id,
        duration: videofileURL?.duration
    }
    )

    if (!publishedVideo) {
        throw new ApiError(500, 'Failed to save video in database')
    }

    return res.status(200).json(new ApiResponse(200, { data: publishedVideo }, 'Video has been published'))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(400, "Video id is required")
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId).populate('owner', 'username email')

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
        .sataus(200)
        .json(new ApiResponse(200, { data: video }, "Video found successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId, title, description, thumbnail } = req.params
    if (!title && !description && !thumbnail) throw new ApiError(400, "Atleast one field is required")
    if (!videoId) throw new ApiError(400, "Video id is required")
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail
    }, { new: true }).populate('owner', 'username', 'email')

    if (!video) {
        throw new ApiError(404, "Video is not found or not updated")
    }

    res.status(200).json(new ApiResponse(200, { data: video }, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(400, "Video id is required")
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findByIdAndDelete(videoId)
    res.sataus(200).json(new ApiResponse(200, { data: video }, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(400, "Video id is required")
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        isPublished: !video.isPublished
    }, { new: true }).populate('owner', 'username email')

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video status")
    }

    res.status(201).json(new ApiResponse(201, { data: updatedVideo }, "Video status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}