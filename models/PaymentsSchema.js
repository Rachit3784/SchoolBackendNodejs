import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
email : {
    type : String,
    required : true
},
     orderId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Orders',
    },
    customerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Users',
        required : true
    },
   razorpay_order_id : {
        type : String,
        require : true
    },
    razorpay_payment_id  : {
        type : String,
        require : true
    },
     razorpay_signature  : { 
        type : String,
        require : true
    },
    date : {
        type : Date,
        default : Date.now
    },
    amount_Paid : {
        type : Number,
        required : true
    }
});

export const PaymentModel = mongoose.model('Payments',PaymentSchema)


