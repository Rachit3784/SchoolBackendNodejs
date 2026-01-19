import e from "express";
import { AddToCart,  AddtoWishList, CheckWishList, DeleteFromCart, DeleteFromWishlist, FetchCartList, FetchOrderLists, FetchWishList, OrderProduct } from "../controller/OrderController.js";
import { verifyToken } from "../Middleware/JwtVerify.js";

export const OrderRouter = e.Router();

OrderRouter.post('/create-order' , verifyToken, OrderProduct );
OrderRouter.get('/fetch-orders',verifyToken,FetchOrderLists);
OrderRouter.post('/add-to-cart',verifyToken,AddToCart);
OrderRouter.get('/fetch-my-cart',verifyToken,FetchCartList)
OrderRouter.get('/delete-from-cart',verifyToken,DeleteFromCart);
OrderRouter.post('/add-to-wishlist',verifyToken,AddtoWishList);
OrderRouter.get('/fetch-my-wishlist',verifyToken,FetchWishList)
OrderRouter.get('/delete-from-wishlist',verifyToken,DeleteFromWishlist);
OrderRouter.post('/check-to-wishlist' , CheckWishList)