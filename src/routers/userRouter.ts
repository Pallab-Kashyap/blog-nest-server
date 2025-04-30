
import express from "express";
import { getUser, updateUser, addSocial, deleteSocial } from "../controllers/user";

const router = express.Router();

router.get("/", getUser);
router.put("/", updateUser);
router.post("/social", addSocial);
router.delete("/social", deleteSocial);

export default router;