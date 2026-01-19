import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chats",
      required: true,
      // Add index for fast message retrieval by chat
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    text: {
      type: String,
      required: true
    },

    // time is redundant due to timestamps: true, but kept for explicit control if needed
    time: { 
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

export const MessagesModel = mongoose.model("Messages", MessageSchema);