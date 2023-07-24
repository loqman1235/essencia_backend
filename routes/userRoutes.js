import express from "express";
import {
  createUser,
  getUserById,
  getUsers,
  removeUser,
  updateUser,
} from "../controllers/userController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, createUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, removeUser);

export default router;
