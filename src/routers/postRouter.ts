
import express from "express";
import {
 getAllPosts,
 getPostDetailsById,
  upvotePost,
  removeUpvote,
  savePost,
  removeSave,
  getLeaderboard,
  getSavedPosts,
} from "../controllers/post/userActions";
import {
  getUserPost,
  publishPost,
  updatePost,
  updatePostStatus,
  deletePost,
} from "../controllers/post/authorActions";
import { auth } from "../middlewares/auth";

const router = express.Router();

// Author actions
router.get("/my", auth, getUserPost);
router.post("/", auth, publishPost);
router.put("/:id", auth, updatePost);
router.patch("/:id/status", auth, updatePostStatus);
router.delete("/:id", auth, deletePost);

//Public actions
router.get("/", getAllPosts);
router.get("/:id", getPostDetailsById);
router.get("/leaderboard", getLeaderboard);

// User actions
router.post("/:id/upvote", auth, upvotePost);
router.delete("/:id/upvote", auth, removeUpvote);
router.get("/saved", auth, getSavedPosts)
router.post("/:id/save", auth, savePost);
router.delete("/:id/save", auth, removeSave);


export default router;