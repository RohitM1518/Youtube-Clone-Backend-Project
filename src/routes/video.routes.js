import { Router } from "express";
import { deleteVideo, getAllVideos, getAllVideosByCondition, getAllVideosByUserID, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()
router.route("/publish-video").post(verifyJWT, upload.fields([
    {
        name:'videoFile',
        maxCount:1
    },
    {
        name:'thumbnail',
        maxCount:1
    }
]),publishAVideo)

router.route("/get-all-videos-by-condition").get(getAllVideosByCondition)
router.route("/get-all-videos").get(getAllVideos)
router.route("/get-video-by-id/:videoId").post(getVideoById)
router.route("/update-video/:videoId").post(verifyJWT, upload.fields([
   { 
    name:'thumbnail',
    maxCount:1
}
]),updateVideo)
router.route("/toggle-publish-status/:videoId").post(verifyJWT,togglePublishStatus)
router.route("/delete-video/:videoId").post(verifyJWT,deleteVideo)
router.route("/get-user-videos/:channelId").get(getAllVideosByUserID)

export default router;