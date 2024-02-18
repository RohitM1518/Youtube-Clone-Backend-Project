import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Playlist} from '../models/playlist.model.js'
import { getuserbyusername } from "../utils/getuserbyusername.middleware.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const owner = req.user?._id
    if(!owner){
        throw new ApiError(400,"Unauthorized request")
    }
    if( !name || typeof name !== 'string' ) throw new ApiError(400,"Name Should be required")
    const playlist = await Playlist.create({
        name,
        description,
        owner
    })
    return res.status(200).json(new ApiResponse(200,playlist,`New playlist created by ${req.user.fullname}`))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {username} = req.params
    const userId = await getuserbyusername(username);
    if(!userId)
    { 
        throw new ApiError(404,'No User Found')
    }
    const playlists = await Playlist.find({owner:userId}).sort('-createdAt');
    return res
            .status(200)
            .json(new ApiResponse(200,playlists,"All playlists of the user are fetched"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId ){
        throw  new ApiError(400,"Invalid Request for playlist")
    }
    const playlist=await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(500,"Something went wrong while fetching the playlist")
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist is Fetched Successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Invalid request to Add to playlist")
    }
    if(!videoId){
        throw new ApiError(400,"Video is required to be added in the playlist")
    }
    let video = await Video.findOne({_id:videoId,owner:req.user._id})
    console.log("Video ",video)
    if (!video) {
        throw new ApiError(401,"You are not the owner of the video or video does not exist.")
    }

    let playlist = await Playlist.findOne({_id:playlistId,owner:req.user._id})
    if (!playlist) {
        throw new ApiError(500,"Something went wrong while fetching the playlist")
    }
     //check whether this video already exists in the playlist
    if(playlist.videos.includes(videoId)){
       throw new ApiError(400,"Video Already exist in the playlist")
    }



    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId },
        // Use $addToSet to add unique videoIds to the videos array
        { $addToSet: { videos: { $each: [video._id] } } },
        { new: true }
      );
    if(!updatePlaylist){
        throw new ApiError(500,"Something went  wrong with adding a video to the playlist")
    }

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Successfully added a video to playlist"))
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Invalid request to delete from playlist")
    }
    if(!videoId){
        throw new ApiError(400,"Video is required to be removed from the playlist")
    }
    let updatedPlaylist = await Playlist.findOneAndUpdate({_id:playlistId,owner:req.user._id},{
        $pull:{videos:videoId}},{new:true})
    if(!updatedPlaylist){
        throw new ApiError(500,"Something went wrong while removing the video from the playlist")
    }

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Video is removed from the playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Invalid request to delete a playlist")
    }   
    const playlist = await Playlist.findOneAndDelete({_id:playlistId,owner:req.user._id})
    if(!playlist){
        throw new ApiError(500,"Something went wrong while deleting the playlist")
    }

    return res.status(200).json(new ApiResponse(200,{},"Playlist is deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!playlistId){
        throw new ApiError(400,"Invalid request to update a playlist")
    }
    if(!name && !description){
        throw new ApiError(400,"Name or Description is required to update the playlist")
    }
    const updatedPlaylist = await Playlist.findOneAndUpdate({_id:playlistId,owner:req.user._id},{
       $set:{ name,description}
    },{new:true})
    if(!updatedPlaylist){
        throw new ApiError(500,"Something went wrong while updating the playlist")
    }

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Playlist is updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}