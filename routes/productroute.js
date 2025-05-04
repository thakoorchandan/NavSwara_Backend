import {upload} from '../middleware/uploadConfig.js'; 
import express from  'express';
import {listProducts,addProduct,removeProduct,singleProduct} from '../controllers/productcontroller.js';
import adminAuth from '../middleware/adminauth.js';

// import upload from '../middleware/multer.js';

const productRouter = express.Router();

const fields = ['image1', 'image2', 'image3', 'image4'].map((name) => ({ name, maxCount: 1 }));
productRouter.post('/add', adminAuth, upload.fields(fields), addProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts)

export default productRouter