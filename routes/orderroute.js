// backend/routes/orderroute.js

import express from "express";
import {
  placeOrderCOD,
  placeOrderStripe,
  placeOrderRazorpay,
  verifyStripe,
  verifyRazorpay,
  allOrders,
  userOrders,
  updateStatus,
} from "../controllers/ordercontroller.js";
import adminAuth from "../middleware/adminauth.js";
import  authUser  from "../middleware/auth.js";

const orderRouter = express.Router();

// ─── Admin routes ─────────────────────────────────
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);

// ─── User‐facing payment routes ───────────────────
orderRouter.post("/place", authUser, placeOrderCOD);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);

// ─── Fetch a user’s own orders ────────────────────
orderRouter.post("/userOrders", authUser, userOrders);

// ─── Verify payments ──────────────────────────────
orderRouter.post("/verifyStripe", authUser, verifyStripe);
orderRouter.post("/verifyRazorpay", authUser, verifyRazorpay);

export default orderRouter;
