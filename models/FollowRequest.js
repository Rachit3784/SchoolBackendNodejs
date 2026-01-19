import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema({
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
  
   
  RequestId: {
    type: String,
    required: true,
  },


  Status: {
    type: String,
    enum: ['Accept', 'Declined', 'Notified'],
    default: 'Notified',
  },


  RequestedAt: {
    type: Date,
    default: Date.now,
  },
});

FriendRequestSchema.index({ RequestId: 1, Status: 1 });

export const FriendRequests = mongoose.model('FollowRequest', FriendRequestSchema);
