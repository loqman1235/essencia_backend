import express from "express";
import upload from "../middlewares/multer.js";
import verifyToken from "../middlewares/verifyToken.js";
import {
  createProduct,
  getAllProducts,
  getProductById,
  removeProduct,
  updateProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", upload.array("photos", 4), verifyToken, createProduct);
router.delete("/:id", verifyToken, removeProduct);
router.put("/:id", upload.array("photos", 4), verifyToken, updateProduct);

export default router;
