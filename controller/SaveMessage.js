import { ChatsModel } from "../models/ChatSchema.js";
import { MessagesModel } from "../models/messageSchema.js";

export const SaveMessage = async (data) => {
  try {
    const { senderId, recieverId, text } = data;
    
    
    if (!senderId || !recieverId || !text)
      return { msg: "Failed to save: Missing data", success: false };

   
    const s = senderId.toString();
    const r = recieverId.toString();
    
    const conversationId = s < r ? `${s}_${r}` : `${r}_${s}`;

    
    let chat = await ChatsModel.findOne({ conversationId });

    if (!chat) {
      chat = await ChatsModel.create({
        conversationId,
        participants: [senderId, recieverId],
      });
      if (!chat) return { msg: "Failed to create chat", success: false };
    }

    
    const message = await MessagesModel.create({
      chatId: chat._id, 
      senderId,
      text,
    });
    
    if (!message) return { msg: "Failed to create message", success: false };

    
    await ChatsModel.findByIdAndUpdate(chat._id, {
        $set: { lastMessageId: message._id }
    });

    return { msg: "Message saved", success: true, message };
  } catch (error) {
    console.error("Error in SaveMessage:", error);
    return { msg: "Failed to save due to server error", success: false };
  }
};