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
    let playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404,"Playlist does not exist.")
    }
     //check whether this video already exists in the playlist
    if(playlist.videos.includes(videoId)){
       throw new ApiError(400,"Video Already exist in the playlist")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video does not exist.")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId },
        // Use $addToSet to add unique videoIds to the videos array
        { $addToSet: { videos: { $each: video._id } } },
        { new: true }
      );
    if(!updatePlaylist){
        throw new ApiError(500,"Something went  wrong with adding a video to the playlist")
    }

    return res.status(200).json(new ApiResponse("Successfully added a video to playlist"))
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId){
        throw new ApiError(400,"Invalid request to delete from playlist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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