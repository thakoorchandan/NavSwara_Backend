import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

//functi0on for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;
        console.log(name, description, price, category, subCategory, sizes, bestseller);

        // Collect all uploaded image files into an array
        const images = req.files ? Object.values(req.files).flat() : [];

        // Upload all images to Cloudinary and get their URLs
        const imagesUrl = await Promise.all(
            images.map(async (file) => {
                try {
                    const result = await cloudinary.uploader.upload(file.path, { resource_type: "image" });
                    return result.secure_url;
                } catch (error) {
                    console.error(`Failed to upload ${file.originalname || file.filename}:`, error.message);
                    throw new Error("Image upload failed");
                }
            })
        );

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestSeller: bestseller === 'true',
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now()
        };
        console.log(productData);

        const product = new productModel(productData);
        await product.save();

        res.json({ success: true, message: "Product Added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


//functions for list product
const listProducts = async (req, res) => {

    try {
        const products = await productModel.find({});
        res.json({ success: true, products })

    } catch (error) {

        console.log(error)
        res.json({ succes: false, message: error.message })

    }

}

//function to remove product
const removeProduct = async (req, res) => {

    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Product removed" })

    } catch (error) {

        console.log(error)
        res.json({ succes: false, message: error.message })

    }

}

//function for single product info
const singleProduct = async (req, res) => {

    try {

        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })

    } catch (error) {

        console.log(error)
        res.json({ succes: false, message: error.message })


    }

}

export { listProducts, addProduct, removeProduct, singleProduct }