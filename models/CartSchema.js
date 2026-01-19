import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    cartProduct: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },

        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariants",
          required: true,
        },

        actualMRP : {
          type : Number ,
          default : 0
        },

        discountedPrice :  {
          type : Number ,
          default : 0
        },

        ProductAmount: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
        },

        coverImage : {
          type: String,
          default: '',
        },

      },
    ],

    totalAmountToPay: {
      type: Number,
      default: 0,
    },

    totalDiscountedMoney: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const CartModel = mongoose.model("Cart", CartSchema);
