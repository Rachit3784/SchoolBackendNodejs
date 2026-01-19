import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    SenderId : {
        type : String ,
        default : ''
    },
     RecieverType : {
        type : String ,
        default : ''
    },
     SenderType  : {
        type : String ,
        default : ''
    },  
     
    RecieverId : {
        type : String ,
        default : ''
    },
    Content : {
        topic : {type : String , default : ''},
        subtopic : {type : String , default : ''},
        content : {type : String , default : ''},
    },
    Urls : {
        UrlType : {type : String , default : ''},
        url : {type : String , default : ''}
    },
   NotifiedAt : {
    type : Date,
    default : Date.now
   }

});

export const NotificationModel = mongoose.model('Notifications',NotificationSchema)