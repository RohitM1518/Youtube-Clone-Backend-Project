import {Router} from 'express'
import { createTweet, deleteTweet, getUserTweets, updateTweet } from '../controllers/tweet.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT) //This  middleware will check if the user is authenticated or not for all routes, and then call the next function only
router.route("/create-tweet").post(createTweet)
router.route("/update-tweet/:id").post(updateTweet)
router.route("/delete-tweet/:tweetId").post(deleteTweet)
router.route("/user-tweets").get(getUserTweets) // protected route -> need to be logged in 

export default router