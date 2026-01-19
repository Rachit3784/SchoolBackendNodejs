import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  StoreOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  StoreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stores",
    required: true
  },

  ProductDescription: [
    {
      title: String,
      subtitle: String
    }
  ],

  ReviewImages: { type: [String], default: [] },

  ReturnPolicy: {
    title: String,
    subtitle: String
  },

  
  Variants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariants"
    }
  ],



  ProductEmbeddings: {
    type: [Number],
    required: true
  },

  Reviews: [
    {
      title: String,
      subtitle: String
    }
  ],

  FAQS: [
    {
      Qus: String,
      Ans: String
    }
  ],

  TotalReviews: { type: Number, default: 0 },
  TimeToDelivar: { type: String, default: "" }

}, { timestamps: true });

export const ProductModel = mongoose.model("Products", ProductSchema);
