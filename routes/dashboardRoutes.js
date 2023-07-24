import express from "express";
import { dashboardCounts } from "../controllers/dashboardController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/dashboard", verifyToken, dashboardCounts);

export default router;
