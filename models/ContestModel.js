import mongoose, { Mongoose } from "mongoose";

const ContestSchema = new mongoose.Schema({
  contestName: {
    type: String,
    required: true,
    trim: true
  },
  Creater : {
   type : mongoose.Schema.Types.ObjectId,
   ref  :'Admin',
   
  },
  ContestCoverImage : {
   type  : String,
   default : ''
  },
  ContestLogo : {
   type  : String,
   default : ''
  },
  maxMembers : {
    type  : Number,
    default : 1
  },
  contestDescription: [
    {
      title: { type: String, default: "" },
      subDescription: { type: String, default: "" },
    },
  ],

  mode: {
    type: String,
    enum: ["Online", "Offline"],
    default: "Offline",
  },

  participants: {
    type: Number,
    default: 0,
    min: 0,
  },

  startDate: {
    type: Date,
    default: Date.now,
  },

  lastDate: {
    type: Date,
    required: true,
  },

  contestDate: {
    type: Date,
    required: true,
  },

  contestType: {
    type: String,
    enum: ["Free", "Paid"],
    default: "Free",
  },

  eligibilityCriteria: {
    type: String,
    default: "",
  },

  durationMinutes: {
    type: Number,
  },

  organizerDetails: {
    contactNumber: String,
    email: String,
    name: String,
    organizationName: String,
  },

  prize: [
    {
      title: String,
      subtitle: String,
    },
  ],

  status: {
    type: String,
    enum: ["Upcoming", "Live", "Expired"],
    default: "Upcoming",
  },

  teamSize: {
    type: String,
    default: "Individual",
  },
}, {
  timestamps: true,
});

export const Contest = mongoose.model("Contest", ContestSchema);
