import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true, 
    },
    participants: [
      { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      }
    ],

    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
      default: null
    },

    convtype: {
      type: String,
      enum: ["p2p", "grp"],
      default: "p2p",
    }
  },
  { timestamps: true }
);

export const ChatsModel = mongoose.model("Chats", ChatSchema);