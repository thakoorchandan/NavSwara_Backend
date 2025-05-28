// backend/routes/userroute.js
import express from "express";
import {
  registerUser, loginUser,
  forgotPassword, verifyResetOTP, resetPassword,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getPaymentMethods, addPaymentMethod, deletePaymentMethod,
  getMyOrders, getMe, adminLogin, getWishlist, addToWishlist, removeFromWishlist
} from "../controllers/usercontroller.js";
import  authUser  from "../middleware/auth.js";

const router = express.Router();

// ─── AUTH ─────────────────────────
router.post("/register",        registerUser);
router.post("/login",           loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp",      verifyResetOTP);
router.post("/reset-password",  resetPassword);

// ─── WISHLIST ─────────────────────────
router.get("/wishlist", authUser, getWishlist);
router.post("/wishlist/add", authUser, addToWishlist);
router.post("/wishlist/remove", authUser, removeFromWishlist);

// ─── ADDRESSES ───────────────────
router.get("/me", authUser, getMe);
router.get   ("/me/addresses",        authUser, getAddresses);
router.post  ("/me/addresses",        authUser, addAddress);
router.put   ("/me/addresses/:index", authUser, updateAddress);
router.delete("/me/addresses/:index", authUser, deleteAddress);

// ─── PAYMENT METHODS ─────────────
router.get   ("/me/payments",        authUser, getPaymentMethods);
router.post  ("/me/payments",        authUser, addPaymentMethod);
router.delete("/me/payments/:index", authUser, deletePaymentMethod);

// ─── ORDERS ───────────────────────
router.get("/me/orders", authUser, getMyOrders);

router.post('/admin', adminLogin)

export default router;
