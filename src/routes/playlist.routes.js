import Router from "express"
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/create-playlist").post(verifyJWT,createPlaylist)
router.route("/get-user-playlists/:username").post(verifyJWT,getUserPlaylists)
router.route("/get-playlist/:playlistId").get(getPlaylistById)
router.route("/add-video-to-playlist/:playlistId/:videoId").post(verifyJWT,addVideoToPlaylist)
router.route("/remove-video-from-playlist/:playlistId/:videoId").post(verifyJWT,removeVideoFromPlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT,deletePlaylist)
router.route("/update-playlist/:playlistId").put(verifyJWT,updatePlaylist)

export default router;