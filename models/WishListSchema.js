import mongoose from "mongoose";

const WishListSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
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

      size: { type: String, required: true },

}, { timestamps: true });


export const WishListModel = mongoose.model("WishList", WishListSchema);
