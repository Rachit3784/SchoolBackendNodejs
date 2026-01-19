import e from "express";

import dotenv from "dotenv"
import { AdminRouter } from "./routes/AdminRoute.js";
import { Dburl } from "./config/ENV_variable.js";
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { StoreRouter } from "./routes/StoreRoutes.js";
import { ConnectDB } from "./config/ConnectDB.js";
import { ProductRouter } from "./routes/ProductRoutes.js";
import { UserRouter } from "./routes/User.routes.js";
import { FetchingStoreRouter } from "./routes/FetchingOrganisationRoute.js";
import { FetchProductRouter } from "./routes/FetchProductroute.js";
import { UserAction } from "./routes/UserAction.js";
import { OfferModel } from "./models/OfferSchema.js";
import { AddressRouter } from "./routes/AdreessRoute.js";
import { OrderRouter } from "./routes/OrderRoute.js";
import { HomeRouter } from "./routes/HomeScreenroute.js";
import { PaymentRouter } from "./routes/PaymentRouter.js";
import { CategoryRoute } from "./routes/CategoryRoutes.js";
import { ProfileRouter } from "./routes/ProfileManagementRoute.js";
import { AddmissionRouter } from "./routes/AddmissionRouter.js";
import { ContestRouter } from "./routes/ContestRoute.js";

dotenv.config();


export const app = e();

const start = async ()=>{
  
    
    app.use(e.json());
    app.use(cookieParser());
app.use(cors({
  
  origin:[ 'http://192.168.152.1:5173' , 'http://localhost:5173' ,'exp://10.36.28.27:8081', '127.0.0.0.1'],
  
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

   app.use('/product',ProductRouter)
   app.use('/admin',AdminRouter)
   app.use('/store',StoreRouter);
   app.use('/authenticate',UserRouter)
   app.use('/fetch-store',FetchingStoreRouter)
   app.use('/fetch-product',FetchProductRouter)
   app.use('/user-action',UserAction)
   app.use('/address',AddressRouter)
   app.use('/order',OrderRouter)
   app.use('/payment',PaymentRouter)
   app.use('/home',HomeRouter);
   app.use('/category',CategoryRoute);
   app.use('/profile-manage',ProfileRouter);
   app.use('/school',AddmissionRouter)
   app.use('/Contest',ContestRouter)
   await  ConnectDB(Dburl)
}


start();