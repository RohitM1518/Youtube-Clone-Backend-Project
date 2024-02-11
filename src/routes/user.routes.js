import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
router.route("/register").post(
    upload.fields([ 
        //fields is used to upload multiple files
        //Here we are using multer middleware to upload the file
        //This will upload the file before the registerUser method is called
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, updateAccountDetails) //patch is used to update only some feilds like name and id not all, if we use post it will update everything
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watchhistory").get(verifyJWT, getWatchHistory)

export default router