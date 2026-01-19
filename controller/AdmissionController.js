import { AdmissionModel } from "../models/AdmissionModel.js";

export const createAdmission = async (req, res) => {
  try {
    const {
      userId,
      addressId,
      studentName,
      Class,
      dateOfBirth,
      contactNo
    } = req.body;

    
    if (
      !userId ||
      !addressId ||
      !studentName ||
      !Class ||
      !dateOfBirth ||
      !contactNo
    ) {
      return res.status(400).json({
        success: false,
        msg: "Details are missing"
      });
    }

    // ✅ Prevent duplicate active application
    const existingApplication = await AdmissionModel.findOne({
      userId,
      status: { $ne: "Expired" }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        msg: "Already applied"
      });
    }

    // ✅ CREATE ADMISSION
    const admissionData = await AdmissionModel.create({
      userId,
      addressId,
      studentName,
      Class,
      dateOfBirth,
      contactNo
    });

    return res.status(201).json({
      success: true,
      msg: "Admission request submitted successfully",
      admissionData
    });
  } catch (error) {
    console.error("🔥 Admission Controller Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error"
    });
  }
};



export const fetchAdmission = async (req, res) => {
  try {
    const { userId , page = 1 , limit =10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        msg: "UserId is missing",
        success: false
      });
    }


    const skip = (page-1)*limit;
    const admissionData = await AdmissionModel.find({ userId }).skip(skip).limit(limit).populate('addressId').populate('userId','email');
 

    if (!admissionData.length) {
      return res.status(404).json({
        msg: "No Application Found",
        success: false
      });
    }

    return res.status(200).json({
      msg: "Successfully fetched",
      success: true,
      admissionData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false
    });
  }
};


