import nodemailer from 'nodemailer'

import { htmlTemplate } from './StoreCodeHTML.js';
import { Email, Email_Pass } from '../config/ENV_variable.js';

const transport = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : Email,
        pass : Email_Pass
    }
});




export const SendOtpToAdmin = async (data)=>{


    const HTML = await htmlTemplate(data);

const mailOptions = {
    from : Email,
    to : data.OwnerEmail,
    subject : 'Store Creation Confirmation Code',
    text : data.Code,
    html : HTML
}

return new Promise((resolve,reject)=>{


    transport.sendMail(mailOptions , async (error,info)=>{
if(error){
    console.log(error)
    reject(error)
}else{
    console.log(info)
    resolve({ Otp : data.Code , info})
}
})


})



}
