import { NotificationModel } from "../models/NotificationSchema";

export const CreateNotification = async (SenderId , RecieverType , SenderType , RecieverId , Content , Urls)=>{
    try{


        const Notification = await NotificationModel.create(SenderId , RecieverType , SenderType  , RecieverId , Content = {}, Urls ={})


        if(!Notification) return {msg : 'Failed to Sent' , success : false};
        return {msg : 'Successfully to Sent' , success : true};
        

    }catch(error){
console.log(error)
return {msg : 'Internal Server Error ' , success : false};
    }
}