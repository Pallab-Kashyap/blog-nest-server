
import express from "express";
import { createUser, login, updatePassword } from "../controllers/authController";
import { auth } from "../middlewares/auth";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", login);
router.patch("/update-password", auth, updatePassword)

export default router;