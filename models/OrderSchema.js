import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },

  
  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
      },
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variants",
        required: true,
      },
      coverImage: { type: String, default: "" },
      ProductName: { type: String, required: true },
      ProductAmount: { type: String, default: "" },

      actualMRP: { type: Number, required: true },
      discountedMRP: { type: Number, required: true },
      quantity: { type: Number, required: true },

      StoreAddressID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
      },
      StoreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stores",
        required: true,
      },
    },
  ],

  appliedOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offers",
    default: null,
  },

  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },

  invoiceId: { type: String },

  totalAmountToPay: {
    type: Number,
    required: true,
  },

  totalAmountOfProductsMoney: {
    type: Number,
    required: true,
  },

  DeliveryCharge: { type: Number, default: 0 },
  PlatFormFees: { type: Number, default: 0 },
  HandellingFees: { type: Number, default: 0 },
  WalletDiscount  : {type : Number , default : 0},
  totalDiscountedMoney: {
    type: Number,
    required: true,
  },

  orderStatus: {
    type: String,
    enum: [
      "Ordered",
      "Viewed",
      "Packed",
      "CancelledBySeller",
      "CancelledByCustomer",
      "Shipped",
      "NearTown",
      "Delivered",
    ],
    default: "Ordered",
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "UPI", "CARD", "NETBANKING", "WALLET" ,"WALLET AND COD" , "WALLET AND UPI"],
    required: true,
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payments",
    default: null,
  },

  paymentDone: {
    type: Boolean,
    default: false,
  },

  cancellationReason: {
    type: String,
    default: null,
  },

}, { timestamps: true });

export const OrderModel = mongoose.model("Orders", OrderSchema);
