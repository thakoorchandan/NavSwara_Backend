import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart
} from "../controllers/cartcontroller.js";

const router = express.Router();

// fetch current cart
router.post("/get",    auth, getUserCart);
// add one qty of itemId/size
router.post("/add",    auth, addToCart);
// set exact quantity (or remove if ≤0)
router.post("/update", auth, updateCart);
// remove entire product entry
router.post("/remove", auth, removeFromCart);

// (optional) clear everything
router.post("/clear",  auth, async (req,res)=>{
  await clearCart(req.user.id);
  res.json({ success:true });
});

export default router;
