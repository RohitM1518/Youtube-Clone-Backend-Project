import Router from "express"
import { createPlaylist, getPlaylistById, getUserPlaylists } from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/create-playlist").post(verifyJWT,createPlaylist)
router.route("/get-user-playlists/:username").post(verifyJWT,getUserPlaylists)
router.route("/get-playlist/:playlistId").post(getPlaylistById)

export default router;