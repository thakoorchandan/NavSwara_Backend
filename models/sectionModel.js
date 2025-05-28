import mongoose from "mongoose";
import slugify from "slugify";

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

sectionSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.models.Section || mongoose.model("Section", sectionSchema);
