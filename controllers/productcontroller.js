// backend/controllers/productcontroller.js

import { v2 as cloudinary } from "cloudinary";
import Product from "../models/productModel.js";

/**
 * POST /api/product/add
 */
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
      tags,
      brand,
      color,
      inStock = true,
      averageRating = 0,
    } = req.body;

    // parse JSON-encoded arrays
    const sizesArr = sizes ? JSON.parse(sizes) : [];
    const tagsArr = tags ? JSON.parse(tags) : [];
    const colorsArr = color ? JSON.parse(color) : [];

    // separate multer files
    const files = Array.isArray(req.files) ? req.files : [];
    const coverFile = files.find((f) => f.fieldname === "coverImage");
    const otherFiles = files.filter((f) => f.fieldname !== "coverImage");

    if (!coverFile) {
      return res
        .status(400)
        .json({ success: false, message: "coverImage is required" });
    }

    // upload coverImage
    const coverRes = await cloudinary.uploader.upload(coverFile.path, {
      resource_type: "image",
    });

    // upload other images
    const images = await Promise.all(
      otherFiles.map(async (file) => {
        const r = await cloudinary.uploader.upload(file.path, {
          resource_type: "image",
        });
        return { url: r.secure_url, alt: file.originalname || "" };
      })
    );

    // build & save
    const product = new Product({
      name,
      description,
      price: Number(price),
      coverImage: {
        url: coverRes.secure_url,
        alt: coverFile.originalname || "",
      },
      images,
      category,
      subCategory,
      brand,
      color: colorsArr,
      sizes: sizesArr,
      tags: tagsArr,
      bestSeller: bestSeller === "true",
      inStock: inStock === "false" ? false : true,
      averageRating: Number(averageRating),
    });

    await product.save();
    res.json({ success: true, message: "Product added", product });
  } catch (err) {
    console.error("addProduct error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/product/list
 */
export const listProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      brand,
      tags,
      color,
      minPrice,
      maxPrice,
      inStock,
      bestSeller,
      search,
      sortBy,
      order = "asc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (brand) filter.brand = brand;
    if (tags) filter.tags = { $in: tags.split(",") };
    if (color) filter.color = { $in: color.split(",") };
    if (inStock) filter.inStock = inStock === "true";
    if (bestSeller) filter.bestSeller = bestSeller === "true";
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const sortOptions = {};
    if (sortBy) sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const total = await Product.countDocuments(filter);

    // lean() → plain JS objects with all schema fields
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error("listProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/product/remove
 */
export const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.error("removeProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/product/single
 */
export const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      tags: { $in: product.tags },
    })
      .limit(10)
      .lean();

    res.json({ success: true, product, relatedProducts });
  } catch (error) {
    console.error("singleProduct error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/product/update/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
      tags,
      brand,
      color,
      inStock,
      averageRating,
      existingImages,
      existingCoverImage,
    } = req.body;

    const updateData = {};

    // scalar fields
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (brand !== undefined) updateData.brand = brand;
    if (bestSeller !== undefined) updateData.bestSeller = bestSeller === "true";
    if (inStock !== undefined)
      updateData.inStock = inStock === "false" ? false : true;
    if (averageRating !== undefined)
      updateData.averageRating = Number(averageRating);

    // array fields
    if (sizes !== undefined)
      updateData.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    if (tags !== undefined)
      updateData.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    if (color !== undefined)
      updateData.color = typeof color === "string" ? JSON.parse(color) : color;

    // existing images
    let images = [];
    if (existingImages) {
      const arr =
        typeof existingImages === "string"
          ? JSON.parse(existingImages)
          : existingImages;
      images = arr.map((u) => ({ url: u, alt: "" }));
    }

    // existing coverImage
    let coverImage;
    if (existingCoverImage) {
      coverImage =
        typeof existingCoverImage === "string"
          ? JSON.parse(existingCoverImage)
          : existingCoverImage;
      if (typeof coverImage === "string") {
        coverImage = { url: coverImage, alt: "" };
      }
    }

    // new uploads
    const files = Array.isArray(req.files) ? req.files : [];
    const newCover = files.find((f) => f.fieldname === "coverImage");
    const otherNew = files.filter((f) => f.fieldname !== "coverImage");

    if (newCover) {
      const r = await cloudinary.uploader.upload(newCover.path, {
        resource_type: "image",
      });
      coverImage = { url: r.secure_url, alt: newCover.originalname || "" };
    }

    if (otherNew.length) {
      const newImgs = await Promise.all(
        otherNew.map(async (file) => {
          const r = await cloudinary.uploader.upload(file.path, {
            resource_type: "image",
          });
          return { url: r.secure_url, alt: file.originalname || "" };
        })
      );
      images = images.concat(newImgs);
    }

    if (images.length) updateData.images = images;
    if (coverImage) updateData.coverImage = coverImage;

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated", product: updated });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
