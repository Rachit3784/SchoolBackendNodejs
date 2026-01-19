import nodemailer from 'nodemailer'
import { Email, Email_Pass } from '../config/ENV_variable.js'

const transport = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : Email,
        pass : Email_Pass
    }
});

export const SendOtpToUser = async (data)=>{
const mailOptions = {
    from : Email,
    to : data.userEmail,
    subject : 'OTP To Register As Admin',
    text : data.otp,
    html : data.HTML
}

return new Promise((resolve,reject)=>{


    transport.sendMail(mailOptions , async (error,info)=>{
if(error){
    console.log(error)
    reject(error)
}else{
  
    resolve({ otp : data.otp , info})
}
})


})



}
