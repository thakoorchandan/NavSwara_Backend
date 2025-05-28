import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";

// Add a review
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });
    // Recalculate product average rating & reviewCount
    const agg = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    if (agg.length) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: agg[0].avg,
        reviewCount: agg[0].count
      });
    }
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get reviews for a product
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    const reviews = await Review.find({ product: productId }).populate("user", "name");
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove a review (user or admin)
export const removeReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      $or: [{ user: req.user.id }, { /* admin logic can go here */ }]
    });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    // Update rating & count
    const agg = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    if (agg.length) {
      await Product.findByIdAndUpdate(review.product, {
        averageRating: agg[0].avg,
        reviewCount: agg[0].count
      });
    } else {
      await Product.findByIdAndUpdate(review.product, {
        averageRating: 0,
        reviewCount: 0
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
