import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();


router.route("/toggle-subscription/:channelname").post(verifyJWT,toggleSubscription)
router.route("/subscribers/:channelname").get(getUserChannelSubscribers)
router.route("/subscribedto").get(verifyJWT,getSubscribedChannels)

export default router