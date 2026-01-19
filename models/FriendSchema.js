import mongoose from 'mongoose';

const FriendSchema = new mongoose.Schema({
  SenderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "ContactType1"
  },
  RecieverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "ContactType2"
  },

  ContactType1: {
    type: String,
    required: true,
    enum: ["Users", "Stores", "Admin"]
  },
   ContactType2: {
    type: String,
    required: true,
    enum: ["Users", "Stores", "Admin"]
  },

  ConnectionId: {
    type: String,
    required: true,
  },


  messagePermission: {
    type: Boolean,
    default: false,
  },

  ConnectedAt: {
    type: Date,
    default: Date.now,
  },


});

FriendSchema.index({ ConnectionId: 1, SenderId: 1 }, { unique: true });

export const FriendsModel = mongoose.model('FriendsModel', FriendSchema);
