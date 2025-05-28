import express from "express";
import { upload } from "../middleware/uploadConfig.js";
import adminAuth from "../middleware/adminauth.js";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
  bulkUploadProducts
} from "../controllers/productcontroller.js";

const router = express.Router();

router.post("/add", adminAuth, upload.any(), addProduct);
router.patch("/update/:id", adminAuth, upload.any(), updateProduct);
router.post("/remove", adminAuth, removeProduct);
router.post("/single", singleProduct);
router.get("/list", listProducts);
router.post("/product/bulk-upload", adminAuth, upload.single("csv"), bulkUploadProducts);
export default router;
