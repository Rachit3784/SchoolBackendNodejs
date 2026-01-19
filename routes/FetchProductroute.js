import e from "express";
import { FetchCategoryProduct, FetchPerticularProduct, FetchProductofAllCategory, FetchSearchedProduct, getNearbyProducts, trendingProduct } from "../controller/FetchProduct.js";

export const FetchProductRouter = e();

FetchProductRouter.get('/fetch-trending-product', trendingProduct)
FetchProductRouter.get('/fetch-selected-product' , FetchPerticularProduct)
FetchProductRouter.get('/fetch-searched-product',FetchSearchedProduct);
FetchProductRouter.get('/fetch-near-by-products',getNearbyProducts);
FetchProductRouter.get('/fetch-parant-category-products',FetchProductofAllCategory);
FetchProductRouter.get('/fetch-selected-category-product',FetchCategoryProduct);