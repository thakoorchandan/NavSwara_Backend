// backend/models/ordermodel.js

import mongoose from "mongoose";

const PaymentDetailSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["COD", "Stripe", "Razorpay", "Card"],
      required: true,
    },
    transactionId: { type: String },
    currency: { type: String, default: "inr" },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    cardBrand: { type: String },
    cardLast4: { type: String },
    cardExpMonth: { type: Number },
    cardExpYear: { type: Number },
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    // — NEW: exactly what the user selected at order time —
    selectedSize: { type: String },
    selectedColor: { type: String },

    // — EMBED A SNAPSHOT OF ALL PRODUCT DETAILS —
    productSnapshot: {
      coverImage: {
        url: String,
        alt: String,
      },
      images: [
        {
          url: String,
          alt: String,
        },
      ],
      description: String,
      brand: String,
      tags: [String],
      colorOptions: [String], // all available colors
      sizeOptions: [String], // all available sizes
    },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },

    itemsSubtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentDetail: { type: PaymentDetailSchema, required: true },

    status: {
      type: String,
      enum: ["Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Order Placed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
