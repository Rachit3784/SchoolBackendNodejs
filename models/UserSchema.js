import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    gender : {
        type : String,
        enum : ["Male" , "Female" , "Others"],
        required : true
    },
    myapplications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applications",
        default : null
    }] ,
    MobileNum : {
        type : String,
        default : ''
    },

    totalCartAmount : {
        type: Number,
        default: 0,
        
    },
    totalCartProduct : {
        type: Number,
        default: 0,
        
    },

    WalletMoney : {
type : Number ,
default : 0
    },

    totalCartSavedAmount : {
        type: Number,
        default: 0,
        
    },

    totalOrder: {
        type: Number,
        default: 0,
        required: true
    },
    Order: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders",
        default : null
    }],
    totalDelivered: {
        type: Number,
        required: true,
        default: 0
    },
    Cancelled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders",
        default : null
    }],
    totalCancelled: {
        type: Number,
        required: true,
        default: 0
    },
    embeddings : {
        type : [Number],
        require : true,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    
    profile: {
        type: String,
        default: ""
    },

    randomNum: {
        type: String,
        required: true
    },
    accountType : {
        type : String,
        default : 'Private',
        enum : ['Private','Public']
    },
    LikedPost : [{
        type : mongoose.Schema.Types.ObjectId,
        default : null,
        ref : "Products"
    }],

    SharedPost : [{
        type : mongoose.Schema.Types.ObjectId,
        default : null,
        ref : "Products"
    }],
    CommentedPost : [{
        type : mongoose.Schema.Types.ObjectId,
        default : null,
        ref : "Products"
    }],


    productShared : [{
        type : mongoose.Schema.Types.ObjectId,
        default : null,
        ref : "Products"
    }],


    SearchQuery : [
        {
            type : String , 
            default : "" , 
            
        }
    ],
    UserKeyWord : [{
        type : String ,
        
        default : ""
    }],
    UserDescription : {
        type : String,
         
        default : ""
    },
    AddressId : {
        type : [mongoose.Schema.Types.ObjectId],
        default : []
    }
    


    

});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const Users = mongoose.model("Users", UserSchema);
