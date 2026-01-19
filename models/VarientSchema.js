import mongoose from "mongoose";

 
const VariantSchema = new mongoose.Schema({
  ProductName: {
    type: String,
    required: true
  },

  ProductKeywords: {
    type: String,
    required: true
  },

  pricing: {
      
      actualMRP: { type: Number, required: true },
      discountPercentage: { type: Number, required: true },
      discountedPrice: { type: Number, required: true },
      
    }
  ,

  Parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true
  },

  ProductAmount: {
    type: String, //100gm 200gm 100ml
    required: true
  },
 ParantCategoryId : {
   type : mongoose.Schema.Types.ObjectId,
   ref : 'ParentCategory'
  },
 CategoryId : {
   type : mongoose.Schema.Types.ObjectId,
   ref : 'Category'
  },

CategoryName : {
  type : String ,
  default : '',
},


  

  offers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offers"
    }
  ],

  rating: { type: Number, default: 0 },

  ratingMap: [
    {
      title: Number,
      subtitle: Number,
      people: Number
    }
  ],

  images: { type: [String], default: [] },
  coverImage: { type: String },

  
  
  videoLinks: { type: [String], default: [] },

  Trending: { type: Boolean, default: false },
 
  
  Stock: { type: Number, default: 0 },
  TotalLikes: { type: Number, default: 0 },
  TotalShared: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 }

}, { timestamps: true });

VariantSchema.index({
  ProductName: "text",
  ProductKeywords: "text",
  Category: "text"
});

export const VarientModel = mongoose.model("ProductVariants", VariantSchema);
