import { Users } from "../models/UserSchema.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateEmbedding } from "./EmbeddingCreation.js";
import mongoose from "mongoose";
import { SendOtpToUser } from "../utils/OtpMailer.js";
import { privateKey } from "../config/ENV_variable.js";





const htmlTemplate = (otp) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Royal Public School Verification</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family: 'Inter', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 32px; text-align: center; border-bottom: 4px solid #fbbf24;">
              <div style="font-family: 'Cinzel', serif; font-size: 28px; color: #fbbf24; letter-spacing: 2px; margin-bottom: 8px;">
                ROYAL PUBLIC SCHOOL
              </div>
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">
                Empowering Minds • Shaping Futures
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #1e293b; font-weight: 700;">Secure Portal Access</h1>
              
              <div style="margin-bottom: 32px; padding: 0 20px;">
                <p style="font-style: italic; color: #64748b; font-size: 15px; line-height: 1.5;">
                  "The roots of education are bitter, but the fruit is sweet."
                </p>
              </div>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #475569;">
                To ensure the security of our royal community, please use the following One-Time Password to complete your verification.
              </p>

              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 32px; display: inline-block; min-width: 240px;">
                <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                  Verification Code
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 700; color: #1e293b; letter-spacing: 10px;">
                  ${otp}
                </div>
              </div>

              <p style="margin-top: 32px; font-size: 14px; color: #94a3b8;">
                This code will expire in <strong>5 minutes</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">
                Questions? Contact the School Administration Office.
              </div>
              <div style="font-size: 12px; color: #94a3b8;">
                If you did not request this code, please ignore this email.
              </div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 24px; font-size: 12px; color: #475569; text-align: center;">
          © 2026 Royal Public School. All Rights Reserved. <br/>
          Building Excellence, Integrity, and Leadership.
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





const LocalOTP = new Map();
const LocalTimeouts = new Map();

export const CreateUser = async (req, res) => {
  try {
    const { username, fullname, email, password , gender } = req.body;

    // 1. Input validation
    if (!username || !fullname || !email || !password) {

      return res.status(400).json({ msg: "Details are missing" });
    }

    
    const exist = await Users.findOne({ email });
    if (exist) {
    
      return res.status(400).json({ msg: "User with this email already exists" });
    }

  
    const hashPassword = await bcrypt.hash(password, 10);
    const Otp =  generateOtp();
    const html = htmlTemplate(Otp)
    
    const result =  await SendOtpToUser({ otp : Otp, HTML: html, userEmail: email });

    
    if (!result || !result.info.messageId) {
       
      return res.status(400).json({ msg: "Failed to send OTP email" });
    }

    
    LocalOTP.set(email, {
      myotp: result.otp,
      username,
      fullname,
      hashPassword,
      gender,
      
    });

    
    const existingTimeout = LocalTimeouts.get(email);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      LocalTimeouts.delete(email);
    }

    const timeout = setTimeout(() => {
      LocalOTP.delete(email);
    }, 5 * 60 * 1000); // 2 minutes

    LocalTimeouts.set(email, timeout);

    // 9. Respond to client
    return res.status(200).json({
      msg: "OTP sent to your email",
      success : true
    });

  } catch (error) {
    console.error("CreateUser Error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};



export const verifyUser = async (req, res) => {
  try {
    const { email, otp } = req.body;
  
    const exist = LocalOTP.get(email);
    
    if (!exist) {
      return res.status(400).json({
        msg: "Invalid OTP or OTP expired",
      });
    }

  

    if (otp !== exist.myotp) {
      return res.status(400).json({
        msg: "Incorrect OTP",
      });
    }

    let randomNum = '';
    for (let i = 0; i < 5; i++) {
      randomNum += Math.floor(Math.random() * 10);
    }


    const data = await Users.create({
      username: exist.username,
      fullname: exist.fullname,
      password: exist.hashPassword,
      gender : exist.gender,
      email,
      randomNum
    });




   


    
    const mytoken = jwt.sign(
      { userId: data._id, email, randomNum },
      privateKey,
      { expiresIn: '30d', algorithm : 'RS256'}
    );
   
  
    res.cookie('token', mytoken, {
      httpOnly: true,
    
    });

    
    LocalOTP.delete(email);
    LocalTimeouts.delete(email);
    
    return res.status(200).json({
      success: true,
      msg: "Account created successfully",
      detail : data ,
      
  token: mytoken
    });

    

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error"
    });
  }
};



export const LoginWithCookie = async (req,res)=>{

try{

  const user = req.MatchedUser;

  if(user){
    return res.status(200).json({
      msg : "Logged In",
      userdata : user,
      success : true
    })
  }
  
  else{
    return res.status(400).json({
      msg : "Failed to Logged In",
      
      success : false
    })
  }

}catch(error){
  console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success : false
    });
}

}





export const LoginUser = async (req, res) => {
  try {
   
    const { email, password } = req.body;
  
    // 1. Input validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Email or Password missing" });
    }

    // 2. Find user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 4. Generate new randomNum for session freshness
    let randomNum = '';
    for (let i = 0; i < 5; i++) {
      randomNum += Math.floor(Math.random() * 10);
    }

    user.randomNum = randomNum;
    await user.save();



    // 5. Generate token
    const mytoken = jwt.sign(
      { userId: user._id, email: user.email, randomNum },
      privateKey,
     { expiresIn: '30d', algorithm : 'RS256'}
    );


    
  

    // 6. Set cookie
    res.cookie('token', mytoken, {
      httpOnly: true,
      
    });

    return res.status(200).json({
      success: true,
      msg: "Login successful alalalala",
      detail : user,
      token : mytoken ,
        
     
    });
  } catch (error) {
    console.error("LoginUser Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// ----------------- forgetPasswordRequest -----------------
export const forgetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // 1. Check if user exists
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email" });
    }

    // 2. Send OTP via email

    const otp = await generateOtp();
    const html = htmlTemplate(otp)
    const { Otp, info } = await SendOtpToUser({otp, HTML: html, userEmail: email })
    if (!info || !info.messageId) {
      return res.status(400).json({ msg: "Failed to send OTP email" });
    }

    // 3. Store OTP in memory
    LocalOTP.set(email, { myotp: Otp, userId: user._id });

    // Clear old timeout if exists
    const existingTimeout = LocalTimeouts.get(email);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      LocalTimeouts.delete(email);
    }

    // Expire OTP in 2 mins
    const timeout = setTimeout(() => {
      LocalOTP.delete(email);
    }, 5 * 60 * 1000);

    LocalTimeouts.set(email, timeout);

    return res.status(200).json({ msg: "OTP sent to your email", success: true });
  } catch (error) {
    console.error("forgetPasswordRequest Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" , success : false});
  }
};

// ----------------- AccountRecover -----------------
export const AccountRecover = async (req, res) => {
  try {
    const { identifier } = req.body; // can be either email OR username

    if (!identifier) {
      return res.status(400).json({ msg: "Provide username or email" });
    }

    // Search by email OR username
    const user = await Users.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(404).json({ msg: "Account not found", success: false });
    }

    return res.status(200).json({
      msg: "Found account",
      success: true,
      account: {
        username: user.username,
        email: user.email,
        profileUrl: user.profileUrl || null, // in case profile picture available
      }
    });
  } catch (error) {
    console.error("AccountRecover Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};




export const verifyForgetPassUserOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
      
        const exist = LocalOTP.get(email);

        if (!exist) {
            return res.status(400).json({
                msg: "Invalid OTP or OTP expired", success: false
            });
        }

        if (otp !== exist.myotp) {
            return res.status(400).json({
                msg: "Incorrect OTP",
                success: false
            });
        }

        // ✅ IMPORTANT: Do not delete the OTP here. Mark it as verified instead.
        LocalOTP.set(email, { ...exist, verified: true });

        return res.status(200).json({ msg: "OTP has been verified", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Internal Server Error",
            success: false
        });
    }
};


export const actionOnforgetPass = async (req, res) => {
    try {
        const { email, password } = req.body;
        
   
        
        const exist = LocalOTP.get(email);
        
        // ✨ Check for both existence and the 'verified' flag
        if (!exist || !exist.verified) {
            return res.status(400).json({
                msg: "Invalid request, OTP not verified or timeout", 
                success: false
            });
        }

        let randomNum = '';
        for (let i = 0; i < 5; i++) {
            randomNum += Math.floor(Math.random() * 10);
        }
        
        let data;
        if (password) {
            const hashedPass = await bcrypt.hash(password, 10);
            data = await Users.findOneAndUpdate(
                { _id: exist.userId }, // Use the user ID from LocalOTP for a more secure lookup
                { $set: { password: hashedPass } },
                { new: true }
            );
        }
        
        if (!data) {
            return res.status(404).json({
                msg: "User not found or update failed.",
                success: false
            });
        }
       
        const mytoken = jwt.sign(
            { userId: data._id, email: data.email },
            privateKey,
            { expiresIn: '30d', algorithm : 'RS256'}
        );

        
        res.cookie('token', mytoken, {
            httpOnly: true,
            // secure: true, // uncomment in production
            // sameSite: 'Strict'
        });
        
        // ✅ Finally, clean up OTP and timeout after a successful password reset
        LocalOTP.delete(email);
        
        const existingTimeout = LocalTimeouts.get(email);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            LocalTimeouts.delete(email);
        }

        return res.status(200).json({
            success: true,
            msg: "Password updated successfully",
            detail: data,
            token: mytoken,
            
          
        });
        
    } catch(error) {
        console.error(error);
        return res.status(500).json({
            msg: "Internal Server Error",
            success: false
        });
    }
};



export const updateProfile = async (req,res)=>{

  
  try{


    const { userRole , userDescription , email } = req.body;

     if(!email) return res.status(400).json({msg : "email not exist" , success : false});
    if(!userRole && !userDescription ) return res.status(400).json({msg : "no detail provided" , success : false});

    const update = await Users.findOneAndUpdate({email : email} , {$push : {UserKeyWord : userRole } , $set : {UserDescription : userDescription} } , {new : true})



    if(!update) return res.status(400).json({msg : "No User Exist with this email" , success : false });

    return res.status(200).json({
      msg : "Details for Profile is Updated" , success : true , data : update
    })

  }catch(error){

console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      success : false
    });

  }
}





export const UpdateUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, UserDescription, UserKeyWord } = req.body;

    if (!userId) {
      await session.abortTransaction();
      return res.status(400).json({ msg: "Bad request - Missing userId", success: false });
    }

    
  const text = UserDescription + UserKeyWord.join(",")

    const response = await generateEmbedding(text);


     if (!response.success) {
      throw new Error(response.msg || "Embedding generation failed");
    }


    const user = await Users.findOneAndUpdate(
      { _id: userId },
      { $set: { UserDescription: UserDescription || "", UserKeyWord: UserKeyWord || [] , embeddings : response.embeddings} },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      return res.status(400).json({ msg: "User not found or updated", success: false });
    }

    // await UserEmbedding.create(
    //   [
    //     {
    //       userId: user._id,
    //       embeddings: response.embeddings,
    //     },
    //   ],
    //   { session }
    // );

    await session.commitTransaction();

    return res.status(200).json({ msg: "User Updated", success: true , result : user  });

  } catch (error) {
    console.error("UpdateUser Error:", error);
    await session.abortTransaction();
    return res.status(500).json({
      msg: "Internal Server Error",
      success: false,
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};




export const UserInfoSearch = async (req,res)=>{
  try{

    const {userId} = req.query;

    const FindUser = await Users.findById(userId)

    return res.status(200).json({msg : 'Fetched' , success : true , user : FindUser});

  }catch(error){
    console.log(error)
    return res.status(500).json({msg : 'Internal Server Error' , success : false});
  }
}