// backend/models/usermodel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── Sub-schemas ────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["COD", "Stripe", "Razorpay", "Card"],
      required: true,
    },
    cardBrand: { type: String },
    cardLast4: { type: String },
    expMonth: { type: Number },
    expYear: { type: Number },
  },
  { _id: false }
);

// ─── Main Schema ───────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    addresses: { type: [addressSchema], default: [] },
    paymentMethods: { type: [paymentMethodSchema], default: [] },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

    cartData: { type: Map, of: Map, default: {}, select: false },

    resetOTP: String,
    resetOTPExpires: Date,
  },
  { timestamps: true }
);

// ─── Hooks & Methods ───────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.verifyOTP = function (otp) {
  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  return hash === this.resetOTP && Date.now() < this.resetOTPExpires;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
