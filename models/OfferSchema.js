import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },
  subtitle: { type: String },
  description: { type: String },
  offerImage: { type: String },

  offerType: {
    type: String,
    enum: ["BANK", "DISCOUNT", "CASHBACK", "EMI"],
  },

  discountPercentage: { type: Number },
  discountAmount: { type: Number },

  minOrderValue: { type: Number },

  validFrom: { type: Date },
  validTill: { type: Date },

  isActive: {
    type: Boolean,
    default: true,
  },

  
  applicableVariants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariants",
    },
  ],

}, { timestamps: true });

export const OfferModel = mongoose.model("Offers", OfferSchema);
