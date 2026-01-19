
import { deleteFromCloudinary, uploadBuffer } from "../config/ConnectCloudinary.js";
import { SendOtpToAdmin } from "../Mails/StoreConfirmationCodeMailer.js";

import { StoreModel } from "../models/StoreSchema.js";
import { generateEmbedding } from "./EmbeddingCreation.js";

const AdminOTPMap = new Map();
const AdminTimeouts = new Map();


const generateRandomOTP = () => {
  let otp = "";
  for (let i = 0; i < 6; i++) otp += Math.floor(Math.random() * 10);
  return otp;
};



export const InitializeStoreCreation = async (req, res) => {
  try {

    
    const {
      StoreName,
      OwnerName,
      StoreEmail,
      StoreUniqueNameId,
      // OwnerId,
      OwnerEmail,
      OwnerContactNumber,
      address,
      Facebook,
      Instagram,
      LinkedIn,
      Youtube,
      Threads,
      Is24Hours,
       VideoLink,
        OpeningTime,
      ClosingTime,

    } = req.body;

    // ✅ 1. Validate Required Fields
    if (
      !StoreName ||
      !OwnerName ||
      // !OwnerId ||
      !OwnerEmail ||
      !StoreUniqueNameId ||
      !StoreEmail ||
      !OwnerContactNumber
    ) {
 






      
      return res
        .status(400)
        .json({ msg: "Missing required fields", success: false });
    }

    // ✅ 2. Check for existing store
    const existingStore = await StoreModel.findOne({ StoreUniqueNameId });
    if (existingStore) {
      return res.status(400).json({
        msg: "Store already exists with this Unique Name",
        success: false,
      });
    }


    // ✅ 4. Clear previous OTP attempt for this admin
    const existingTimeout = AdminTimeouts.get(OwnerEmail);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      AdminTimeouts.delete(OwnerEmail);
      AdminOTPMap.delete(OwnerEmail);
    }

    // ✅ 5. Generate and Send OTP
    const otp = generateRandomOTP();
    const { Otp, info } = await SendOtpToAdmin({
      StoreName,
      OwnerEmail,
      OwnerName,
      Code: otp,
    });

    if (!info || !info.messageId) {
      return res.status(400).json({
        msg: "Failed to send OTP. Try again later.",
        success: false,
      });
    }

    // ✅ 6. Cache OTP + Store Data in Memory (expires in 5 mins)
    const timeout = setTimeout(() => {
      AdminOTPMap.delete(OwnerEmail);
      AdminTimeouts.delete(OwnerEmail);
    }, 1000 * 60 * 5);

    AdminOTPMap.set(OwnerEmail, {
      OTP: Otp,
      StoreName,
      OwnerName,
      StoreUniqueNameId,
      // OwnerId,
      OwnerEmail,
      OwnerContactNumber,
      address,
      VideoLink,
      OpeningTime,
      ClosingTime,
      StoreEmail,
       Facebook,
      Instagram,
      LinkedIn,
      Youtube,
      Threads,
      Is24Hours,
    });

    AdminTimeouts.set(OwnerEmail, timeout);

    return res.status(200).json({
      msg: "6-digit Store Confirmation Code sent to your email.",
      success: true,
    });
  } catch (error) {
    console.error("❌ Error Creating Store:", error);
    return res
      .status(500)
      .json({ msg: "Internal Server Error", success: false });
  }
};


export const VerifyStoreCreation = async (req, res) => {

  
  try {
    

    const { OwnerEmail, otp } = req.body;

    
    if (!OwnerEmail || !otp)
      return res.status(400).json({ msg: "Missing fields", success: false });

    
    const existing = AdminOTPMap.get(OwnerEmail);
    if (!existing) {
      return res.status(400).json({
        msg: "OTP expired or invalid request. Please restart the process.",
        success: false,
      });
    }

    
    if (existing.OTP !== otp) {
      AdminOTPMap.delete(OwnerEmail);
      AdminTimeouts.delete(OwnerEmail);
      return res.status(400)
        .json({ msg: "Invalid OTP or Session Expired", success: false });
    }

    
    clearTimeout(AdminTimeouts.get(OwnerEmail));
    AdminTimeouts.delete(OwnerEmail);

    const data = existing;

    
    const store = await StoreModel.create({
      StoreName: data.StoreName,
      OwnerName: data.OwnerName,
      StoreUniqueNameId: data.StoreUniqueNameId,
      // OwnerId: data.OwnerId,
      OwnerEmail: data.OwnerEmail,
      OwnerContactNumber: data.OwnerContactNumber,
      StoreEmail: data.StoreEmail,

      address: data.address,


      VideoLink: Array.isArray(data.VideoLink)
        ? data.VideoLink
        : data.VideoLink
        ? [data.VideoLink]
        : [],
       Facebook : existing.Facebook,
      Instagram : existing.Instagram,
      LinkedIn : existing.LinkedIn,
      Youtube :   existing.Youtube,
      Threads  : existing.Threads,
      Is24Hours : existing.Is24Hours,

      OpeningTime: data.OpeningTime || "",
      ClosingTime: data.ClosingTime || "",
    });


   

    

    AdminOTPMap.delete(OwnerEmail);

    return res.status(200).json({
      msg: "Store Created Successfully",
      success: true,
      storeId: store._id,
    });
  } catch (error) {
    console.error("Error on verifying store:", error);
    return res
      .status(500)
      .json({ msg: "Internal Server Error", success: false });
  }
};


export const AddCoverImages = async (req, res) => {
  try {
    
    const { storeID } = req.body;

    if (!storeID) {
      return res.status(400).json({
        success: false,
        msg: "Store ID is missing in the request body.",
      });
    }

    const existingStore = await StoreModel.findById(storeID);
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        msg: "Store not found.",
      });
    }

    
    const coverFile =
      Array.isArray(req.files?.coverImages) && req.files.coverImages.length > 0
        ? req.files.coverImages[0]
        : null;

    if (!coverFile) {
      return res.status(400).json({
        success: false,
        msg: "Cover image file missing in request.",
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const baseName = coverFile.originalname.split(".")[0];
    const publicId = `store_${storeID}_${baseName}_${dateStr}`;

    const uploadRes = await uploadBuffer(coverFile.buffer, {
      folder: `coverImages/${storeID}`,
      public_id: publicId,
    });

    if (!uploadRes?.secure_url) {
      return res.status(400).json({
        success: false,
        msg: "Failed to upload image to Cloudinary.",
      });
    }

    const updatedStore = await StoreModel.findByIdAndUpdate(
      storeID,
      { $set: { coverImage: uploadRes.secure_url } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      msg: "Cover image uploaded successfully.",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error in AddCoverImages:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: error.message,
    });
  }
};


export const deleteImage = async (req,res)=>{
  try{
    const {imageId , storeId} = req.body;

    if(!imageId) return res.status(400).json({msg : "Details is Missing" , success : false});
        const response  = await deleteFromCloudinary(imageId);
        if(!response) return res.status(400).json({msg : "Failed To Delete" , success : false});

       if(imageId.includes("coverImages")){
                const update = await StoreModel.findByIdAndUpdate(storeId , {$set : {coverImage : ""}} , {new : true});
       }else if(imageId.includes("storeImages")){
const update = await StoreModel.findByIdAndUpdate(storeId , {$pull : {Images : imageId}} , {new : true});
       }



        
        
         return res.status(200).json({msg : "Deleted Image" , success : true});
    
  }catch(error)
  {
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success : false})
  }
}


export const AddStoreImages = async (req, res) => {
  try {
    const { storeID } = req.body;
   

    if (!storeID)
      return res.status(400).json({ msg: "Store ID is missing", success: false });

    const exist = await StoreModel.findById(storeID);
    if (!exist)
      return res.status(404).json({ msg: "Store does not exist", success: false });

    const images = Array.isArray(req.files?.images)
      ? req.files.images
      : [req.files?.images].filter(Boolean);

    if (!images.length)
      return res.status(400).json({ msg: "No images provided", success: false });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uploadedImages = [];

    const uploads = await Promise.all(
      images.map((file, index) => {
        const imgName = file.originalname.split(".")[0];
        const publicId = `store_${storeID}_${imgName}_${dateStr}_${index}`;
        return uploadBuffer(file.buffer, {
          folder: `storeImages/${storeID}`,
          public_id: publicId,
        });
      })
    );

    uploads.forEach((result) => {
      if (result?.secure_url) uploadedImages.push(result.secure_url);
    });

    if (!uploadedImages.length)
      return res.status(400).json({ msg: "Failed to upload images", success: false });

    // Push new images into Images array
    const updatedStore = await StoreModel.findByIdAndUpdate(
      storeID,
      { $push: { Images: { $each: uploadedImages } } },
      { new: true }
    );




    if (!updatedStore)
      return res.status(400).json({ msg: "Failed to update store images", success: false });

    return res.status(200).json({
      msg: "Images uploaded successfully",
      success: true,
      
    });
  } catch (error) {
    
    console.error(error);
    return res.status(500).json({ msg: "Internal Server Error", success: false });
  }
};


export const UpdateStoreDescription = async (req, res) => {
  try {
    const { description, keyword, storeId } = req.body;

    // Validate input
    if (!storeId || !description || !keyword) {
      return res.status(400).json({ msg: "Missing required details", success: false });
    }

    // Ensure keyword is an array
    if (!Array.isArray(keyword)) {
      return res.status(400).json({ msg: "Keywords must be an array", success: false });
    }

    // Check if store exists
    const store = await StoreModel.findById(storeId);
    if (!store) {
      return res.status(404).json({ msg: "Store does not exist", success: false });
    }

    // Combine text for embeddings
    const text = `${description} ${keyword.join(",")}`;

    // Generate embeddings
    const embeddings = await generateEmbedding(text);
    if (!embeddings.embeddings) {
      return res.status(500).json({ msg: "Failed to generate embeddings", success: false });
    }
    // Update store
    const updatedStore = await StoreModel.findByIdAndUpdate(
      storeId,
      {
        $set: {
          Description: description,
          Keywords: keyword,
          StoreEmbeddings: embeddings.embeddings,
        },
      },
      { new: true }
    );

   

    if (!updatedStore) {
      return res.status(400).json({ msg: "Failed to update store", success: false });
    }

    return res.status(200).json({
      msg: "Store updated successfully",
      success: true,
      data: updatedStore,
    });
  } catch (error) {
    
    console.error("Error updating store:", error);
    return res.status(500).json({ msg: "Internal Server Error", success: false });
  }
};


export const fetchAdminStore = async (req, res) => {
  try {
     const {OwnerId , page =1,limit=10} = req.query
     console.log(req.query)
   const skip = (page - 1)*limit;
   
    const storeList = await StoreModel.find({OwnerId}).skip(skip).limit(limit)
      .select("StoreName StoreUniqueNameId address coverImage TotalRatings Is24Hours OpeningTime ClosingTime")
      .lean();

    if (!storeList || storeList.length === 0) {
      return res.status(200).json({ msg: "No stores found", success: true, storeList: [] });
    }


  
    const storeData = storeList.map(item => ({
      StoreId: item._id,
      StoreName: item.StoreName,
      StoreUniqueNameId: item.StoreUniqueNameId,
      address: item.address,
      coverImage: item.coverImage,
      TotalRatings: item.TotalRatings,
      Is24Hours: item.Is24Hours,
      OpeningTime: item.OpeningTime,
      ClosingTime: item.ClosingTime,
    }));

    return res.status(200).json({
      msg: "Fetched successfully",
      success: true,
      storeList: storeData,
    });
  } catch (error) {
    console.error("fetchAdminStore Error:", error);
    return res.status(500).json({ msg: "Internal Server Error", success: false });
  }
};

export const fetchAdminPerticularStore = async ( req,res)=>{
  try{
    const {storeId} = req.query;

    const store = await StoreModel.findById(storeId.toString());
   
    if(!store)  return res.status(400).json({msg : "Store Not Found" , success : false});
    
    return res.status(200).json({msg : "Successfully found you store" , success : true , Store  : store});
    

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success : false});

  }
}


export const UpdateStoreData = async (req, res) => {
  try {
    const {
      StoreId,
      StoreEmail,
      StoreContactNumber,
      addressLine1,
      addressLine2,
      street,
      subregion,
      city,
      state,
      country,
      postalCode,
      district,
      latitude,
      longitude,
      Facebook,
      Instagram,
      LinkedIn,
      Youtube,
      Threads,
      Is24Hours,
      VideoLink,
      OpeningTime,
      ClosingTime,
      FAQs,
    } = req.body;

    if (!StoreId)
      return res
        .status(400)
        .json({ msg: "StoreId is missing", success: false });

    // Fetch existing store
    const existingStore = await StoreModel.findById(StoreId);
    if (!existingStore)
      return res
        .status(404)
        .json({ msg: "Store not found", success: false });

    // Build the update object dynamically
    const updateData = {};

    if (StoreEmail) updateData.StoreEmail = StoreEmail;
    if (StoreContactNumber) updateData.StoreContactNumber = StoreContactNumber;
    if (Facebook) updateData.Facebook = Facebook;
    if (Instagram) updateData.Instagram = Instagram;
    if (LinkedIn) updateData.LinkedIn = LinkedIn;
    if (Youtube) updateData.Youtube = Youtube;
    if (Threads) updateData.Threads = Threads;
    if (Is24Hours !== undefined) updateData.Is24Hours = Is24Hours;
    if (VideoLink) updateData.VideoLink = VideoLink;
    if (OpeningTime) updateData.OpeningTime = OpeningTime;
    if (ClosingTime) updateData.ClosingTime = ClosingTime;
    if (FAQs && FAQs.length > 0) updateData.FAQS = FAQs;

    // Handle nested address
    const addressFields = {
      addressLine1,
      addressLine2,
      street,
      subregion,
      city,
      state,
      country,
      postalCode,
      district,
    };
    const addressToUpdate = {};
    for (const key in addressFields) {
      if (addressFields[key]) addressToUpdate[`address.${key}`] = addressFields[key];
    }

    // Handle location if lat/long provided
    if (latitude && longitude) {
      updateData.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    // Merge nested address fields into updateData
    Object.assign(updateData, addressToUpdate);

    // Perform update
    const updatedStore = await StoreModel.findByIdAndUpdate(
      StoreId,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      msg: "Store updated successfully",
      success: true,
      store: updatedStore,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "Internal Server Error", success: false });
  }
};


export const fetchMyStore = async (req,res)=>{
  try{

    const {OwnerId , page =1,limit=10} = req.query
   const skip = (page - 1)*limit;
   
    const store = await StoreModel.find({OwnerId}).skip(skip).limit(limit);

    if(!store.length) return res.status(400).json({msg : "No Store Registered Yet with this id" , success : false});

    return res.status(200).json({msg : "List of Store" , success : true});

    
    

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : "Internal Server Error" , success : false});
  }
}