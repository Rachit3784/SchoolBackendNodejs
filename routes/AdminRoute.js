import express from 'express';
import { verifyAdminToken } from '../Middleware/JwtVerify.js';
import { forgetPassword, InitializeAdmin, LoginAdmin, LoginWithCookie, SetNewPassword, uploadProfilePic, verifyAndCreateAdmin, verifyForgetPassOTP } from '../controller/Admin.controller.js';
import { uploads } from '../config/MulterSetup.js';

export const AdminRouter = express.Router();

AdminRouter.post('/create-admin', InitializeAdmin);
AdminRouter.post('/verify-admin',verifyAndCreateAdmin);
AdminRouter.post('/login-admin',LoginAdmin);
AdminRouter.post('/login-with-cookie',verifyAdminToken,LoginWithCookie);
AdminRouter.post('/upload-profile-pic',verifyAdminToken,
    uploads.fields([
    { name : 'profile' , maxCount : 1 }
]  ) ,
    uploadProfilePic);

AdminRouter.post('/forget-otp-verify',verifyForgetPassOTP)
AdminRouter.post('/forget-pass',forgetPassword)
AdminRouter.post('/set-new-pass',SetNewPassword)    
    