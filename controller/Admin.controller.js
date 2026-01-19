
import { privateKey } from '../config/ENV_variable.js';
import { Admins } from '../models/AdminSchema.js';
import { SendOtpToUser } from '../utils/OtpMailer.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


import { uploadBuffer } from "../config/ConnectCloudinary.js";
import { StoreModel } from "../models/StoreSchema.js";


// In-memory temporary stores (OTP etc.)
const UserLocalDb = new Map();
const UserLocalTimeouts = new Map();

const htmlTemplate = (otp) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CoachBuddy OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f6fb;font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(135deg,#ffffff 0%, #f8fbff 100%);border-radius:16px;box-shadow:0 8px 30px rgba(20,40,80,0.08);overflow:hidden;">
          <tr>
            <td style="padding:26px 28px 18px;background: linear-gradient(90deg,#0f6ef0,#4fb3ff); color:#fff;">
              <div style="font-size:18px;font-weight:700;">CoachBuddy</div>
              <div style="font-size:13px;opacity:0.95;">OTP Verification</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#0b2546;">
              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;">Hello — this is CoachBuddy</h1>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.5;color:#375a8a;">
                This is your OTP. Do not share it with anyone.
              </p>
              <div style="margin:10px 0 20px 0;padding:18px;border-radius:12px;background:linear-gradient(180deg,#ffffff,#f4f8ff);display:inline-block;box-shadow:0 6px 18px rgba(30,60,120,0.06);">
                <div style="font-size:13px;color:#7a98c2;margin-bottom:6px;">One-time passcode</div>
                <div style="font-family:'Courier New',Courier,monospace;font-size:32px;letter-spacing:4px;font-weight:700;color:#0f4bb7;">
                  ${otp}
                </div>
                <div style="font-size:12px;color:#738ab3;margin-top:8px;">Valid for 2 minutes</div>
              </div>
              <p style="margin:20px 0 0 0;font-size:15px;color:#375a8a;">
                You're taking an excellent step — keep it up! 🚀
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;color:#6a84a8;background:#fbfdff;">
              <hr style="border:none;height:1px;background:linear-gradient(90deg, rgba(15,110,240,0.08), rgba(79,179,255,0.02));margin:6px 0 18px 0;">
              <div style="font-size:13px;color:#6a84a8;">If you didn't request this code, please ignore this email.</div>
            </td>
          </tr>
        </table>
        <div style="max-width:600px;margin-top:12px;font-size:12px;color:#9aaed0;">
          © CoachBuddy — All rights reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

const generateOtp = () => {
  let j = '';
  for (let i = 0; i < 6; i++) {
    j += Math.floor(Math.random() * 10).toString();
  }
  return j;
};



export const InitializeAdmin = async (req, res) => {
  try {
    const { adminUserName, email , adminName , password, consent , dateOfBirth , gender , contactNo } = req.body;



    if (!adminUserName || !email  || !adminName || !password || !consent || !contactNo)
      return res.status(400).json({ msg: 'Details are missing', success: false });

    const exist = await Admins.findOne({ email });
    if (exist) return res.status(400).json({ msg: 'Admin Already Existing', success: false });

    const otp = generateOtp();
    const hashedPass = await bcrypt.hash(password, 10);

    const html = htmlTemplate(otp);
    const result = await SendOtpToUser({ otp, HTML: html, userEmail: email });

    if (!result || !result.otp) return res.status(500).json({ msg: 'Otp sending failed', success: false });

    //Storing data in local db (have to use Redis)
    UserLocalDb.set(email, {
      otp,
      email,
      adminName,
      consent,
      hashedPass,
      password,
      dateOfBirth : dateOfBirth || null,
      contactNo,
      adminUserName ,
      gender
    });

    

    const existingTimingOut = UserLocalTimeouts.get(email);

    if (existingTimingOut) clearTimeout(existingTimingOut);

    const newTimeOut = setTimeout(() => {
      UserLocalDb.delete(email);
      UserLocalTimeouts.delete(email);
    }, 5 * 60 * 1000); 

    UserLocalTimeouts.set(email, newTimeOut);

    

    return res.status(200).json({ msg: 'Otp Sent to your Email', success: true });

  } catch (error) {
    console.error('Error Creating Admin', error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};



export const verifyAndCreateAdmin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ msg: 'Details are Missing', success: false });

    const exist = UserLocalDb.get(email);

    if (!exist) return res.status(400).json({ msg: 'Connection Time Out or OTP Expired', success: false });


    if (exist.otp !== otp || exist.email !== email)
      return res.status(400).json({ msg: 'Invalid OTP', success: false });

    const already = await Admins.findOne({ email });
    if (already) {
      
      UserLocalDb.delete(email);
      const t = UserLocalTimeouts.get(email);
      if (t) clearTimeout(t);
      UserLocalTimeouts.delete(email);
      return res.status(400).json({ msg: 'Admin already exists', success: false });
    }
    
    
    const randomNum = generateOtp();

    
    const data = await Admins.create({
      email,
      adminName: exist.adminName,
      password: exist.hashedPass, 
      consent: exist.consent,
      randomNum,
      contactNo : [exist.contactNo],
      dateOfBirth: exist.dateOfBirth,
      adminUserName: exist.adminUserName,
      gender: exist.gender
    });

    if (!data) return res.status(400).json({ msg: "Failed to create Admin Account Try Again later", success: false });

    

    

   
    UserLocalDb.delete(email);
    const t2 = UserLocalTimeouts.get(email);
    if (t2) clearTimeout(t2);
    UserLocalTimeouts.delete(email);

   
    
    const mytoken = jwt.sign({ email, randomNum }, privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d',
    });

    

    
    res.cookie('token', mytoken, {
      httpOnly: true,
      
    });

    return res.status(200).json({
      msg: 'Admin Verification Done',
      success: true,
      token: mytoken,
     
     
      data: { 
          adminId: data._id.toString(), 
          adminName: data.adminName, 
          email: data.email,
          adminUserName : data.adminUserName,
          dateOfBirth : data.dateOfBirth,
          consent : data.consent ,
          contactNo : data.contactNo[0]
      },
    });

  } catch (error) {
    console.error(error);
   
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};



 export const uploadProfilePic = async ()=>{
    try{

         
    const { profile } = req.files;
    
    let profileUpload = {}

    if (profile?.length){

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const profileFilename = profile[0].originalname.split(".")[0];
    const profilePublicId = `${email}_${profileFilename}_${dateStr}`;

     profileUpload = await uploadBuffer(profile[0].buffer, {
      folder: `profilePics/${adminId}`,
      public_id: profilePublicId,
    });}
   

    }catch(error){
      return res.status(500).json({msg : "Failed to upload image " , success : false})
    }
  }

    




export const LoginAdmin = async (req, res) => {

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Details are missing', success: false });

    const data = await Admins.findOne({ email });
    if (!data) return res.status(400).json({ msg: 'Admin not found with this email', success: false });
   
    const comparePass = await bcrypt.compare(password, data.password);

    if (!comparePass){
      

      return res.status(401).json({ msg: 'Invalid Password', success: false });
    } 

    
    const randomNum = generateOtp();

   
    
  const admiN =   await Admins.findByIdAndUpdate(data._id, { randomNum }, { new: true });

    const mytoken = jwt.sign({ email, randomNum }, privateKey, {
      
      algorithm: 'RS256',
  
      expiresIn: '7d',
    });

  
    

    
    res.cookie('token', mytoken, {
      httpOnly: true,
      
    });


    const stores = await StoreModel.find({OwnerId : data._id});
     
    const storeIds = stores.map((item)=>(item._id))

    return res.status(200).json({ msg: 'Logged In Successfully', success: true, token: mytoken  ,
       data: { adminId: data._id.toString(), adminName: data.adminName, email: data.email , profilePic : data.adminProfile ,
        dateOfBirth : data.dateOfBirth,
          consent : data.consent , adminUserName : data.adminUserName, adminBio : data.adminBio
       }, storeIds
    });


    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};


export const LoginWithCookie = async (req, res) => {
  try {
    
    const { email, randomNum } = req.AdminData || {};


    if (!email) return res.status(401).json({ msg: 'Invalid token payload', success: false });

    const data = await Admins.findOne({ email });
    if (!data) return res.status(400).json({ msg: 'Admin not existing with this email', success: false });

    
    if (data.randomNum && data.randomNum !== randomNum){
      return res.status(403).json({ msg: 'Logged out current session not matched', success: false });
    }

    return res.status(200).json({ msg: 'Admin Logged In', success: true , 
       data: { adminId: data._id.toString(),
       adminName: data.adminName,
       email: data.email , profilePic : data.adminProfile ,
        dateOfBirth : data.dateOfBirth,
          consent : data.consent , adminUserName : data.adminUserName, adminBio : data.adminBio
       }
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false  });
  }
};

export const DeleteAdmin = async ({req,res}) => {
  try {
    const {adminId} = req.body;
    const data = await Admins.findByIdAndDelete(adminId);
    if(!data) return res.status(400).json({msg : "failed Deleted" , success : false});
    return res.status(200).json({msg : "Successfully Deleted" , success : true});
  } catch (error) {
    console.error('Error deleting admin', error);
    throw error;
  }
};


export const UpdateAdmin = async (req,res)=>{
  try{

    const {Whatsapp , LinkedIn , Insta , Thread  , adminBio , Facebook , adminId , WorkedAt , Qualification } = req.body; 

      if(!adminBio || !adminId ) return res.status(400).json({msg :"Details are missing" , success : false});

       const adminUser = await Admins.findByIdAndUpdate(adminId , {$set : {Whatsapp : Whatsapp , Insta : Insta, 
             LinkedIn : LinkedIn , Thread : Thread , Facebook : Facebook , workedAt : WorkedAt , Qualification : Qualification

       }}  , {new : true });

       if(!adminUser){

        return res.status(400).json({msg : "Failed to update" , success : false})

       }



       
       return res.status(200).json({msg : 'Admin Updated ' , success : true});
   
  }catch(error){

    return res.status(500).json({msg : "Internal Server Error" , success : false});
  }
}


export const forgetPassword = async (req,res)=>{
  try{

    const {email}  = req.body; 
     const admin = Admins.findOne({email});

     if(!admin) return res.status(400).json({msg : "Admin Not Found With This email" , success : false});

const otp = generateOtp();
   

    const html = htmlTemplate(otp);
    const result = await SendOtpToUser({ otp, HTML: html, userEmail: email });

    if (!result || !result.otp) return res.status(500).json({ msg: 'Otp sending failed', success: false });

    //Storing data in local db (have to use Redis)
    UserLocalDb.set(email, {
      otp,
      email,
      
    });

    

    const existingTimingOut = UserLocalTimeouts.get(email);

    if (existingTimingOut) clearTimeout(existingTimingOut);

    const newTimeOut = setTimeout(() => {
      UserLocalDb.delete(email);
      UserLocalTimeouts.delete(email);
    }, 5 * 60 * 1000); 

    UserLocalTimeouts.set(email, newTimeOut);

    

    return res.status(200).json({ msg: 'Otp Sent to your Email', success: true });

  } catch (error) {
    console.error('Error Creating Admin', error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};

export const verifyForgetPassOTP = async (req,res)=>{
   try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ msg: 'Details are Missing', success: false });

    const exist = UserLocalDb.get(email);

    if (!exist) return res.status(400).json({ msg: 'Connection Time Out or OTP Expired', success: false });


    if (exist.otp !== otp || exist.email !== email)  return res.status(400).json({ msg: 'Invalid OTP', success: false });
     


    UserLocalDb.delete(email);
    const t2 = UserLocalTimeouts.get(email);
    if (t2) clearTimeout(t2);
    UserLocalTimeouts.delete(email);
    return res.status(200).json({
      msg: 'OTP Verification Done',
      success: true,
    });



  } catch (error) {
    console.error(error);
   
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
}


export const SetNewPassword = async (req, res) => {

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Details are missing', success: false });


    const hashedPass = await bcrypt.hash(password,10);
    const data = await Admins.findOneAndUpdate({ email } , {$set : {password : hashedPass }} ,{new : true});

    if (!data) return res.status(400).json({ msg: 'Admin not found with this email', success: false });
  
    const randomNum = generateOtp();

     
  const admiN =   await Admins.findByIdAndUpdate(data._id, { randomNum }, { new: true });
    const mytoken = jwt.sign({ email, randomNum }, privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d',
    });

  
     
    res.cookie('token', mytoken, {
      httpOnly: true,
    });
    const stores = await StoreModel.find({OwnerId : data._id});
    const storeIds = stores.map((item)=>(item._id))
    return res.status(200).json({ msg: 'Logged In Successfully', success: true, token: mytoken  ,
       data: { adminId: data._id.toString(), adminName: data.adminName, email: data.email , profilePic : data.adminProfile ,
        dateOfBirth : data.dateOfBirth,
          consent : data.consent , adminUserName : data.adminUserName, adminBio : data.adminBio
       }, storeIds
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};
