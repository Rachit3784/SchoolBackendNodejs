import express from "express"
import { verifyAdminToken } from "../Middleware/JwtVerify.js";
import { AddProduct, AddProductImages, fetchAllMyProducts, fetchMyProducts, FetchSelectedProduct } from "../controller/Product.controller.js";
import { uploads } from "../config/MulterSetup.js";
import { FetchCategoryProduct, FetchProductofAllCategory, getNearbyProducts } from "../controller/FetchProduct.js";

export const ProductRouter = express.Router();

ProductRouter.post('/add-product' , verifyAdminToken ,   uploads.fields([{ name: "productcoverImages", maxCount: 1 }]), AddProduct);
ProductRouter.post('/add-product-images',verifyAdminToken,  uploads.fields([{ name: "images", maxCount: 5 }]), AddProductImages)
ProductRouter.get('/fetch-my-product' , fetchMyProducts);
ProductRouter.get('/fetch-all-my-product' , verifyAdminToken, fetchAllMyProducts);
ProductRouter.get('/fetch-selected-product' , verifyAdminToken, FetchSelectedProduct);



