// backend/controllers/ordercontroller.js

import Order from "../models/ordermodel.js";
import User from "../models/usermodel.js";
import Product from "../models/productModel.js";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import { clearCart } from "./cartcontroller.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CURRENCY = "inr";
const SHIPPING_CHARGE = 10;

// ─── Build order items with snapshot ───────────────────────────────
async function buildItems(items) {
  const result = [];
  for (const item of items) {
    const prod = await Product.findById(item.product);
    if (!prod) throw new Error(`Product ${item.product} not found`);

    result.push({
      product: prod._id,
      name: prod.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      productSnapshot: {
        coverImage: prod.coverImage,
        images: prod.images,
        description: prod.description,
        brand: prod.brand,
        tags: prod.tags,
        colorOptions: prod.color,
        sizeOptions: prod.sizes,
      },
    });
  }
  return result;
}

// ─── COD ─────────────────────────────────────────────────────────────
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, items } = req.body;
    if (!shippingAddress || !items?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing address or items" });
    }

    const orderItems = await buildItems(items);
    const itemsSubtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalAmount = itemsSubtotal + SHIPPING_CHARGE;

    const order = await Order.create({
      user: userId,
      shippingAddress,
      items: orderItems,
      itemsSubtotal,
      shippingCharge: SHIPPING_CHARGE,
      taxAmount: 0,
      discount: 0,
      totalAmount,
      paymentDetail: {
        method: "COD",
        currency: CURRENCY,
      },
    });

    await User.findByIdAndUpdate(userId, { cartData: {} });
    await clearCart(userId);

    res.json({
      success: true,
      message: "Order placed (COD)",
      orderId: order._id,
    });
  } catch (err) {
    console.error("placeOrderCOD:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Stripe ──────────────────────────────────────────────────────────
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, items } = req.body;
    const origin = req.headers.origin;

    if (!shippingAddress || !items?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing address or items" });
    }

    const orderItems = await buildItems(items);
    const itemsSubtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalAmount = itemsSubtotal + SHIPPING_CHARGE;

    const order = await Order.create({
      user: userId,
      shippingAddress,
      items: orderItems,
      itemsSubtotal,
      shippingCharge: SHIPPING_CHARGE,
      taxAmount: 0,
      discount: 0,
      totalAmount,
      paymentDetail: {
        method: "Stripe",
        currency: CURRENCY,
      },
    });

    // build Stripe line_items
    const line_items = orderItems.map((i) => ({
      price_data: {
        currency: CURRENCY,
        product_data: { name: i.name },
        unit_amount: i.unitPrice * 100,
      },
      quantity: i.quantity,
    }));
    line_items.push({
      price_data: {
        currency: CURRENCY,
        product_data: { name: "Shipping" },
        unit_amount: SHIPPING_CHARGE * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/verify?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    order.paymentDetail.stripeSessionId = session.id;
    await order.save();

    res.json({ success: true, sessionUrl: session.url });
  } catch (err) {
    console.error("placeOrderStripe:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Verify Stripe ───────────────────────────────────────────────────
export const verifyStripe = async (req, res) => {
  try {
    const { orderId, session_id } = req.body;
    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      order.paymentDetail = {
        ...order.paymentDetail.toObject(),
        stripePaymentIntentId: session.payment_intent,
        transactionId: session.payment_intent,
      };
      order.status = "Processing";
      await order.save();
      await User.findByIdAndUpdate(order.user, { cartData: {} });
      await clearCart(order.user);
      return res.json({ success: true, message: "Payment confirmed" });
    }
    return res
      .status(400)
      .json({ success: false, message: "Payment not completed" });
  } catch (err) {
    console.error("verifyStripe:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Razorpay ────────────────────────────────────────────────────────
export const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, items } = req.body;
    if (!shippingAddress || !items?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing address or items" });
    }

    const orderItems = await buildItems(items);
    const itemsSubtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalAmount = itemsSubtotal + SHIPPING_CHARGE;

    const order = await Order.create({
      user: userId,
      shippingAddress,
      items: orderItems,
      itemsSubtotal,
      shippingCharge: SHIPPING_CHARGE,
      taxAmount: 0,
      discount: 0,
      totalAmount,
      paymentDetail: {
        method: "Razorpay",
        currency: CURRENCY,
      },
    });

    const rOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: CURRENCY.toUpperCase(),
      receipt: order._id.toString(),
    });

    order.paymentDetail.razorpayOrderId = rOrder.id;
    await order.save();

    res.json({ success: true, order: rOrder });
  } catch (err) {
    console.error("placeOrderRazorpay:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Verify Razorpay ─────────────────────────────────────────────────
export const verifyRazorpay = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    order.paymentDetail = {
      ...order.paymentDetail.toObject(),
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId: razorpay_payment_id,
    };
    order.status = "Processing";
    await order.save();
    await User.findByIdAndUpdate(order.user, { cartData: {} });
    await clearCart(order.user);
    res.json({ success: true, message: "Payment successful" });
  } catch (err) {
    console.error("verifyRazorpay:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: list all orders ─────────────────────────────────────────
export const allOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "email name");
    res.json({ success: true, orders });
  } catch (err) {
    console.error("allOrders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── User: get own orders ───────────────────────────────────────────
export const userOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("userOrders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: update status ───────────────────────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, message: "Status updated", order });
  } catch (err) {
    console.error("updateStatus:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
