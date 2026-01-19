import e from "express";
import { verifyAdminToken } from "../Middleware/JwtVerify.js";
import { createAdmission, fetchAdmission } from "../controller/AdmissionController.js";

export const AddmissionRouter = e.Router()

AddmissionRouter.post('/admission-request',verifyAdminToken,createAdmission);
AddmissionRouter.get('/fetch-admission',verifyAdminToken,fetchAdmission);