// backend/controllers/usercontroller.js
import User from "../models/usermodel.js";
import Order from "../models/ordermodel.js";
import jwt from "jsonwebtoken";
import validator from "validator";
import nodemailer from "nodemailer";
import crypto from "crypto";

// — JWT helper —
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// — Mailer —
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ─── AUTH ─────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });
  if (!validator.isEmail(email))
    return res.status(400).json({ success: false, message: "Invalid email" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ success: false, message: "Password ≥8 chars" });
  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: "Email in use" });
    const user = new User({ name, email, password });
    await user.save();
    const token = signToken(user._id, user.role);
    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email & password required" });
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const token = signToken(user._id, user.role);
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: "Email required" });
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "No account with that email" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await transporter.sendMail({
      from: `"NavSwara Support"<${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your password reset code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Could not send OTP email" });
  }
};

export const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res
      .status(400)
      .json({ success: false, message: "Email & OTP required" });
  try {
    const user = await User.findOne({ email }).select(
      "resetOTP resetOTPExpires"
    );
    if (!user || !user.verifyOTP(otp))
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });
  if (newPassword.length < 8)
    return res
      .status(400)
      .json({ success: false, message: "Password ≥8 chars" });
  try {
    const user = await User.findOne({ email }).select(
      "password resetOTP resetOTPExpires"
    );
    if (!user || !user.verifyOTP(otp))
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password has been reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADDRESSES ────────────────────────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select("addresses");
    res.json({ success: true, addresses: u.addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    u.addresses.push(req.body);
    await u.save();
    res.status(201).json({ success: true, address: u.addresses.at(-1) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateAddress = async (req, res) => {
  const i = Number(req.params.index);
  try {
    const u = await User.findById(req.user.id);
    if (!u.addresses[i])
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    u.addresses[i] = { ...u.addresses[i].toObject(), ...req.body };
    await u.save();
    res.json({ success: true, address: u.addresses[i] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteAddress = async (req, res) => {
  const i = Number(req.params.index);
  try {
    const u = await User.findById(req.user.id);
    if (!u.addresses[i])
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    u.addresses.splice(i, 1);
    await u.save();
    res.json({ success: true, message: "Address removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PAYMENT METHODS ───────────────────────────────────────────────────────
export const getPaymentMethods = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select("paymentMethods");
    res.json({ success: true, paymentMethods: u.paymentMethods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addPaymentMethod = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    u.paymentMethods.push(req.body);
    await u.save();
    res
      .status(201)
      .json({ success: true, paymentMethod: u.paymentMethods.at(-1) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePaymentMethod = async (req, res) => {
  const i = Number(req.params.index);
  try {
    const u = await User.findById(req.user.id);
    if (!u.paymentMethods[i])
      return res
        .status(404)
        .json({ success: false, message: "Payment method not found" });
    u.paymentMethods.splice(i, 1);
    await u.save();
    res.json({ success: true, message: "Payment method removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ORDERS ───────────────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email createdAt");
    if (!user) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("getMe:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
