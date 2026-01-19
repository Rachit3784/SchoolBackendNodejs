import express from "express"
import { AddCoverImages, AddStoreImages, deleteImage, fetchAdminPerticularStore, fetchAdminStore, InitializeStoreCreation, UpdateStoreDescription, VerifyStoreCreation } from "../controller/CreateStore.js";
import { verifyToken } from "../Middleware/JwtVerify.js";
import { uploads } from "../config/MulterSetup.js";


export const StoreRouter = express.Router();


StoreRouter.post('/create-store', verifyToken ,InitializeStoreCreation);
StoreRouter.post('/verify-store-creation-otp' , verifyToken , VerifyStoreCreation);
StoreRouter.get('/myStore',verifyToken,fetchAdminPerticularStore)

StoreRouter.post(
  "/add-images",
  verifyToken,
  uploads.fields([{ name: "images", maxCount: 5 }]), 
  AddStoreImages
);
StoreRouter.post(
  "/delete-image",
  verifyToken,
  
  deleteImage
);



StoreRouter.post(
  "/add-cover-image",
  uploads.fields([{ name: "coverImages", maxCount: 1 }]),
  verifyToken, 
  AddCoverImages
);
StoreRouter.get('/fetch-store-by-admin' , verifyToken , fetchAdminStore)
StoreRouter.post('/Store-Description-Update' , verifyToken , UpdateStoreDescription)
