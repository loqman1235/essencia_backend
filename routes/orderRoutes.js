import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import {
  createOrder,
  getAllOrders,
  updateDeliveryStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Get Orders
router.get("/", verifyToken, getAllOrders);
router.put("/:id", verifyToken, updateDeliveryStatus);
export default router;
