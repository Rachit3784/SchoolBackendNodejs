import mongoose from "mongoose";


const StoreSchema = new mongoose.Schema({
  StoreName: { type: String, required: true },
  OwnerName: { type: String, required: true },
  OwnerId: { type: String, required: true },
  OwnerEmail: { type: String, required: true },
  OwnerContactNumber: { type: String, default: "" },
  StoreUniqueNameId: { type: String, required: true, unique: true },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
  },
  StoreEmbeddings: { type: [Number], default: [] },
  TotalOrders: { type: Number, default: 0 },
  TotalPendingOrders: { type: Number, default: 0 },
  TotalMessages: { type: Number, default: 0 },
  salesData: [
    {
      date: Date,
      totalSales: Number,
      ordersCount: Number
    }
  ],

  TotalFriends: { type: Number, default: 0 },
  TotalProducts: { type: Number, default: 0 },
  TotalTeachers : {type : Number , default : 0},
  TotalAdmissionRequest : {type : Number , default : 0},
  TotalStudents : {type : Number , default : 0},
  TotalLabs : {type : Number,default : 0},
  TotalClassrooms : {type : Number , default : 0},


 
  Description: { type: String, default: "" },
  Keywords: { type: [String], default: [] },

  coverImage: { type: String, default: "" },
  Images: { type: [String], default: [] },
  
  VideoLink: { type: [String], default: [] },
  TotalLikes: { type: Number, default: 0 },
  TotalShared: { type: Number, default: 0 },
  TotalComments: { type: Number, default: 0 },
  TotalCustomers: { type: Number, default: 0 },
  TotalProductsSelled: { type: Number, default: 0 },
  TotalRatings: { type: Number, default: 0 },
  Is24Hours: { type: Boolean, default: false },
  StoreEmail: { type: String, default: "" },
  StoreContactNumber: { type: String, default: "" },
  OpeningTime: { type: String, default: "" },
  ClosingTime: { type: String, default: "" },
  FAQS: [
    {
      Qus: String,
      Ans: String
    }
  ],
  brands: [
    {
      brandName: String,
      brandsImages: String
    }
  ]
}, { timestamps: true });

export const StoreModel = mongoose.model("Stores", StoreSchema);
