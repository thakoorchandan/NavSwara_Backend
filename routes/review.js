import express from 'express';
import { addReview, getReviews, removeReview } from "../controllers/reviewcontroller.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

router.post("/add", authUser, addReview);
router.get("/list", getReviews);
router.post("/remove", authUser, removeReview);

export default router
