import express from "express";
import upload from "../middlewares/multer.js";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  removeBrand,
  updateBrand,
} from "../controllers/brandController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", getAllBrands);
router.get("/:id", getBrandById);
router.post("/", upload.single("image"), verifyToken, createBrand);
router.put("/:id", upload.single("image"), verifyToken, updateBrand);
router.delete("/:id", verifyToken, removeBrand);

export default router;
