import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    adminUserName : {
        type : String,
        required : true
    },
    contactNo : {
    type : [String],
    default : []
    },
       adminProfile  :{
            type : String,
            default : ''
        },
        dateOfBirth : {
            type : Date,
            required : true
        },
       

        gender : {
            type : String,
            enum : ["Male","Female","Others"],
            require : true
            
        },
        
        email : {
            type : String,
            unique : true,
            required : true
        },

        workedAt : {
            type : String,
            default : ""
        },
        Qualification : {
            type : String ,
            default : ""
        },

        address : {
         type : String,
          default : ""
        },


    Whatsapp: {
            type : String,
            default : ''
        },
        Insta :{
            type : String,
            default : ''
        },

        LinkedIn  :{
            type : String,
            default : ''
        },

        Facebook  :{
            type : String,
            default : ''
        },

        Thread  :{
            type : String,
            default : ''
        },

        adminName : {
            type : String,
            required : true
        },
       
        adminBio  : {
            type : String,
            default : ''
        },
        password :{
            type : String, 
            required : true
        },


        
        consent : {
            type : Boolean,
            required : true
        },
        paid: {
                type: Boolean,
                default: false
            },
       

        randomNum : {
            type : String,
            default : "",
        },

       

        myStores: {
            type :[String],
            default : null,
        },
        
        totalStores : {
            type : Number,
            default : 0,
        },

        myEmployee : {
            type :[String],
            default : null,
        },

        totalEmployee : {
            type : Number,
            default : 0
        },
       totalFollower : {
        type : Number,
        default : 0
       },
         totalFollowing : {
        type : Number,
        default : 0
       },

});

export const Admins = mongoose.model("Admin",AdminSchema);