import express from "express"
import { CreatePaymentOrderId, VerifyPayment,AddWalletMoney ,FetchWalletMoney} from "../controller/PaymentController.js";
import { verifyAdminToken } from "../Middleware/JwtVerify.js";

export const PaymentRouter = express.Router();

PaymentRouter.post('/create-order-id', verifyAdminToken ,CreatePaymentOrderId);
PaymentRouter.post('/verify-payment' , verifyAdminToken, VerifyPayment);
PaymentRouter.post('/add-to-wallet',verifyAdminToken,AddWalletMoney)
PaymentRouter.post('/fetch-wallet',verifyAdminToken,FetchWalletMoney)
