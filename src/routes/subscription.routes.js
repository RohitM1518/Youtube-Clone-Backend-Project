import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription,isChannelSubscribed } from "../controllers/subscription.controller.js";

const router = Router();


router.route("/toggle-subscription/:channelId").post(verifyJWT,toggleSubscription)
router.route("/subscribers/:channelId").get(getUserChannelSubscribers)
router.route("/subscribedto/:channelId").get(getSubscribedChannels)
router.route("/issubscribed").get(verifyJWT,isChannelSubscribed)

export default router