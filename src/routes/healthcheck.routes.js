import { healthcheck } from "../controllers/healthcheck.controller.js";
import { Router } from "express";

const router = Router()
router.route("/health-check").get(healthcheck)

export default router