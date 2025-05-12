import Cart from "../models/cartmodel.js";

// ─── GET CART ──────────────────────────────────────────────────────────────
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    const cartData = {};
    if (cart) {
      for (const item of cart.items) {
        const pid = item.product.toString();
        cartData[pid] ??= {};
        cartData[pid][item.size] = item.quantity;
      }
    }
    return res.json({ success: true, cartData });
  } catch (err) {
    console.error("getUserCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADD ONE ITEM ─────────────────────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [{ product: itemId, size, quantity: 1 }]
      });
    } else {
      const idx = cart.items.findIndex(
        i => i.product.toString() === itemId && i.size === size
      );
      if (idx > -1) {
        cart.items[idx].quantity += 1;
      } else {
        cart.items.push({ product: itemId, size, quantity: 1 });
      }
    }
    await cart.save();

    const cartData = {};
    for (const item of cart.items) {
      const pid = item.product.toString();
      cartData[pid] ??= {};
      cartData[pid][item.size] = item.quantity;
    }
    return res.json({ success: true, cartData });
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE QUANTITY ───────────────────────────────────────────────────────
export const updateCart = async (req, res) => {
  try {
    const { itemId, size, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.json({ success: true, cartData: {} });

    const idx = cart.items.findIndex(
      i => i.product.toString() === itemId && i.size === size
    );
    if (idx > -1) {
      if (quantity > 0) {
        cart.items[idx].quantity = quantity;
      } else {
        // remove that size
        cart.items.splice(idx, 1);
      }
      await cart.save();
    }

    const cartData = {};
    for (const item of cart.items) {
      const pid = item.product.toString();
      cartData[pid] ??= {};
      cartData[pid][item.size] = item.quantity;
    }
    return res.json({ success: true, cartData });
  } catch (err) {
    console.error("updateCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REMOVE PRODUCT ────────────────────────────────────────────────────────
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.json({ success: true, cartData: {} });

    cart.items = cart.items.filter(i => i.product.toString() !== itemId);
    await cart.save();

    const cartData = {};
    for (const item of cart.items) {
      const pid = item.product.toString();
      cartData[pid] ??= {};
      cartData[pid][item.size] = item.quantity;
    }
    return res.json({ success: true, cartData });
  } catch (err) {
    console.error("removeFromCart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CLEAR ENTIRE CART ─────────────────────────────────────────────────────
export const clearCart = async (userId) => {
  await Cart.deleteOne({ user: userId });
};
