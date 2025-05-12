import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "" }
});

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, text: true },
  slug:        { type: String, unique: true, index: true },
  description: { type: String, required: true, text: true },
  price:       { type: Number, required: true, index: true },

  coverImage: {
    url:    { type: String, required: true },
    alt:    { type: String, default: "" }
  },
  images:     [ imageSchema ],

  category:   { type: String, required: true, index: true },
  subCategory:{ type: String, default: "", index: true },
  brand:      { type: String, default: "", index: true },
  color:      [{ type: String, index: true }],
  sizes:      [{ type: String }],
  tags:       [{ type: String, lowercase: true, trim: true, index: true }],
  bestSeller: { type: Boolean, default: false, index: true },
  inStock:    { type: Boolean, default: true,  index: true },
  averageRating:{ type: Number, default: 0,   index: true },
  reviewCount:{ type: Number, default: 0 }
}, {
  timestamps: true
});

productSchema.pre("validate", function(next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

productSchema.index({ price: 1, category: 1, inStock: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text" });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
