import { FriendRequests } from "../models/FollowRequest.js";
import {  Users } from "../models/UserSchema.js";

export const MakeFriendRequest = async (SenderId, SenderType , RecieverType , RecieverId)=>{
try{

    const RequestId = SenderId>RecieverId ? SenderId + RecieverId : RecieverId + SenderId

    const RequestData = await FriendRequests.create({

        SenderId,
        RecieverId,
        ContactType2 : RecieverType,
        ContactType1 : SenderType,
        RequestId
    })

    if(!RequestData) {
     return {msg : 'Failed To Request' , success : false};
    }

    const User1 = await Users.findById(SenderId)
    const User2 = await Users.findById(RecieverId)

  return {msg : 'request Sent' , success : true , RequestId , SenderName : User1.fullname , RecieverName : User2.fullname};



}catch(error){
    console.log(error)
    return {msg : 'Internal Server Error' , success : false};
}
}