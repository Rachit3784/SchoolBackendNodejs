import jwt from "jsonwebtoken"
import { publicKey } from "../config/ENV_variable.js";

export const verifyToken = async (req,res,next)=>{
    try{
      console.log("jkjk")
   
        const mytoken = (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        console.log(mytoken)
    if (!mytoken) {
      return res.status(401).json({ msg: "Unauthorized", success: false });
    }
  


        const decode = jwt.verify(mytoken , publicKey , {algorithms : ['RS256']});
        console.log('JWT verified:', decode);

     

        if(!decode){
          return res.status(400).json({mas : "Session Token Expired" , success : false});
        }


       next()

    }catch(error){
        console.log("Error verifying token" , error);
        return res.status(500).json({msg : "Internal Server Issue" , success : false});
    }
}






export const verifyAdminToken = async (req,res,next)=>{
    try{
    
        const mytoken = 
      req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);


      console.log("yaha tak aake token nahi hai " , mytoken)
      
    if (!mytoken) {
      return res.status(401).json({ msg: "Unauthorized", success: false });
    }


        const decode = await jwt.verify(mytoken , publicKey , {algorithms : ['RS256']});
         console.log('JWT verified:', decode);

       req.AdminData = {email : decode.email,randomNum : decode.randomNum}

        if(!decode){
          return res.status(400).json({mas : "Session Token Expired" , success : false});
        }


       next()

    }catch(error){
        console.log("Error verifying token" , error);
        return res.status(500).json({msg : "Internal Server Issue" , success : false});
    }
}