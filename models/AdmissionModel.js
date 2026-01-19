import mongoose from "mongoose";

const AdmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    branch : {
         type : String,
         default : ''
    },
    Class: {
      type: String,
      required: true
    },
    contactNo: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["Sent", "Processing", "Accepted", "Rejected", "Expired"],
      default: "Sent"
    }
  },
  { timestamps: true }
);

export const AdmissionModel = mongoose.model(
  "Admissions",
  AdmissionSchema
);
