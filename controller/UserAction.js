import mongoose from 'mongoose';
import { FriendRequests } from '../models/FollowRequest.js';
import { FriendsModel } from '../models/FriendSchema.js';
import { Users } from '../models/UserSchema.js';

const makeConnectionId = (a, b) => {
  const A = String(a);
  const B = String(b);
  return A > B ? A + B : B + A;
};

const computeMessagePermission = (senderAccountType, receiverAccountType, followDoc) => {
  if (senderAccountType === 'Public' && receiverAccountType === 'Public') {
    return !!followDoc;
  }

  if (senderAccountType === 'Private' && receiverAccountType === 'Private') {
    return !!(followDoc && followDoc.FollowBack === true);
  }

  if (senderAccountType === 'Private' && receiverAccountType === 'Public') {
    return !!followDoc;
  }

  if (senderAccountType === 'Public' && receiverAccountType === 'Private') {
    return !!followDoc;
  }

  return false;
};

export const friendRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { UserId, reqType, accountType, friendId } = req.query;
    if (!UserId || !reqType || !friendId || !accountType) {
      return res.status(400).json({ msg: 'Details are missing', success: false });
    }

    const connectionId = makeConnectionId(UserId, friendId);

    const existingConnection = await FriendsModel.findOne({ ConnectionId: connectionId });
    const pendingRequest = await FollowRequests.findOne({
      RequestId: connectionId,
      Status: 'Notified',
    });

    const [userA, userB] = await Promise.all([
      Users.findById(UserId).select('accountType').lean(),
      Users.findById(friendId).select('accountType').lean(),
    ]);
    const userAType = userA?.accountType || 'Public';
    const userBType = userB?.accountType || 'Public';

    // FOLLOW (Public)
    if (reqType === 'Following' && accountType === 'Public') {
      if (existingConnection) {
        if (
          existingConnection.SenderId.toString() === UserId &&
          existingConnection.Type.includes('Following')
        ) {
          return res.status(400).json({ msg: 'Already Following', success: false });
        }

        const newMessagePermission = computeMessagePermission(
          userAType,
          userBType,
          { ...existingConnection.toObject(), FollowBack: true }
        );

        await FriendsModel.findOneAndUpdate(
          { ConnectionId: connectionId },
          {
            $set: {
              FollowBack: true,
              Type: ['Following', 'Follower'],
              messagePermission: newMessagePermission,
            },
          }
        );

        return res.status(200).json({ msg: 'FollowBack Successful', success: true });
      }

      const initialMessagePermission = computeMessagePermission(userAType, userBType, {
        FollowBack: false,
        Type: ['Following'],
      });

      await FriendsModel.create({
        SenderId: UserId,
        RecieverId: friendId,
        ConnectionId: connectionId,
        Type: ['Following'],
        FollowBack: false,
        messagePermission: initialMessagePermission,
        messagePermissionUpdatedAt: new Date(),
      });

      return res.status(200).json({ msg: 'Following Successfully', success: true });
    }

    // FOLLOW (Private) -> Request
    if (reqType === 'Following' && accountType === 'Private') {
      if (
        existingConnection &&
        existingConnection.SenderId.toString() === UserId &&
        existingConnection.Type.includes('Following')
      ) {
        return res.status(400).json({ msg: 'Already Following', success: false });
      }

      if (pendingRequest && pendingRequest.SenderId.toString() === UserId) {
        return res.status(400).json({ msg: 'Already Requested', success: false });
      }

      if (pendingRequest && pendingRequest.RecieverId.toString() === UserId) {
        return res
          .status(400)
          .json({ msg: 'User has already requested you. Accept instead.', success: false });
      }

      await FollowRequests.create({
        SenderId: UserId,
        RecieverId: friendId,
        RequestId: connectionId,
        Status: 'Notified',
        RequestedAt: new Date(),
      });

      return res.status(200).json({ msg: 'Request Sent', success: true });
    }

    // ACCEPT (Private)
    if (reqType === 'Accept') {
      if (!pendingRequest) {
        return res.status(404).json({ msg: 'No such request exists', success: false });
      }

      if (pendingRequest.RecieverId.toString() !== UserId) {
        return res.status(403).json({ msg: 'Not allowed', success: false });
      }

      await session.withTransaction(async () => {
        await FollowRequests.deleteOne({ _id: pendingRequest._id }).session(session);

        const existing = await FriendsModel.findOne({ ConnectionId: connectionId }).session(
          session
        );

        if (existing) {
          if (existing.SenderId.toString() === pendingRequest.SenderId.toString()) {
            const newMessagePermission = computeMessagePermission(
              userBType,
              userAType,
              { ...existing.toObject(), FollowBack: true }
            );

            await FriendsModel.findOneAndUpdate(
              { ConnectionId: connectionId },
              {
                $set: {
                  FollowBack: true,
                  Type: ['Following', 'Follower'],
                  messagePermission: newMessagePermission,
                },
              }
            ).session(session);
          } else {
            const simulated = { Type: ['Following'], FollowBack: false };
            const newMessagePermission = computeMessagePermission(
              userAType,
              userBType,
              simulated
            );

            await FriendsModel.findOneAndUpdate(
              { ConnectionId: connectionId },
              {
                $set: {
                  SenderId: pendingRequest.SenderId,
                  RecieverId: pendingRequest.RecieverId,
                  Type: ['Following'],
                  FollowBack: false,
                  messagePermission: newMessagePermission,
                },
              },
              { upsert: true }
            ).session(session);
          }
        } else {
          const simulated = { Type: ['Following'], FollowBack: false };
          const newMessagePermission = computeMessagePermission(
            userAType,
            userBType,
            simulated
          );

          await FriendsModel.create(
            [
              {
                SenderId: pendingRequest.SenderId,
                RecieverId: pendingRequest.RecieverId,
                ConnectionId: connectionId,
                Type: ['Following'],
                FollowBack: false,
                messagePermission: newMessagePermission,
                messagePermissionUpdatedAt: new Date(),
              },
            ],
            { session }
          );
        }
      });

      return res.status(200).json({ msg: 'Request Accepted', success: true });
    }

    // DECLINE
    if (reqType === 'Decline') {
      if (!pendingRequest) {
        return res.status(404).json({ msg: 'No such request exists', success: false });
      }
      if (pendingRequest.RecieverId.toString() !== UserId) {
        return res.status(403).json({ msg: 'Not allowed', success: false });
      }

      await FollowRequests.deleteOne({ _id: pendingRequest._id });
      return res.status(200).json({ msg: 'Request Declined', success: true });
    }

    // CANCEL REQUEST
    if (reqType === 'CancelRequest') {
      if (!pendingRequest) {
        return res
          .status(404)
          .json({ msg: 'No pending request to cancel', success: false });
      }
      if (pendingRequest.SenderId.toString() !== UserId) {
        return res.status(403).json({ msg: 'Not allowed', success: false });
      }
      await FollowRequests.deleteOne({ _id: pendingRequest._id });
      return res.status(200).json({ msg: 'Request Cancelled', success: true });
    }

    // UNFOLLOW
    if (reqType === 'Unfollow') {
      if (!existingConnection) {
        return res.status(404).json({ msg: 'Not following', success: false });
      }

      const isSender = existingConnection.SenderId.toString() === UserId;
      const isReceiver = existingConnection.RecieverId.toString() === UserId;

      if (isSender) {
        const newType = existingConnection.Type.filter((t) => t !== 'Following');

        if (newType.length === 0) {
          await FriendsModel.deleteOne({ ConnectionId: connectionId });
        } else {
          const newFollowBack = false;
          const newMessagePermission = computeMessagePermission(userAType, userBType, {
            Type: newType,
            FollowBack: newFollowBack,
          });

          await FriendsModel.findOneAndUpdate(
            { ConnectionId: connectionId },
            {
              $set: {
                Type: newType,
                FollowBack: newFollowBack,
                messagePermission: newMessagePermission,
              },
            }
          );
        }

        return res.status(200).json({ msg: 'Unfollowed', success: true });
      }

      if (isReceiver) {
        await FriendsModel.deleteOne({ ConnectionId: connectionId });
        return res.status(200).json({ msg: 'Relationship removed', success: true });
      }

      return res.status(400).json({ msg: 'Invalid Unfollow operation', success: false });
    }

    // FollowBack explicit
    if (reqType === 'FollowBack') {
      if (!existingConnection) {
        return res.status(400).json({ msg: 'User must follow you first', success: false });
      }

      if (
        existingConnection.SenderId.toString() === friendId &&
        existingConnection.RecieverId.toString() === UserId
      ) {
        if (existingConnection.FollowBack) {
          return res.status(400).json({ msg: 'Already FollowBack', success: false });
        }

        const newMessagePermission = computeMessagePermission(
          userAType,
          userBType,
          { ...existingConnection.toObject(), FollowBack: true }
        );

        await FriendsModel.findOneAndUpdate(
          { ConnectionId: connectionId },
          {
            $set: {
              FollowBack: true,
              Type: ['Following', 'Follower'],
              messagePermission: newMessagePermission,
            },
          }
        );
        return res.status(200).json({ msg: 'FollowBack Successful', success: true });
      }

      const newMessagePermission = computeMessagePermission(
        userAType,
        userBType,
        { ...existingConnection?.toObject(), FollowBack: true }
      );

      await FriendsModel.findOneAndUpdate(
        { ConnectionId: connectionId },
        {
          $set: {
            FollowBack: true,
            Type: ['Following', 'Follower'],
            messagePermission: newMessagePermission,
          },
        },
        { upsert: true }
      );
      return res.status(200).json({ msg: 'FollowBack Successful', success: true });
    }

    return res.status(400).json({ msg: 'Invalid Request Type', success: false });
  } catch (error) {
    console.error('Error in friendRequest:', error);
    return res
      .status(500)
      .json({ msg: 'Server Error', success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

export const CheckProfile = async (req, res) => {
  try {
    const { UserId, friendId, accountType } = req.query;
    if (!UserId || !friendId || !accountType)
      return res.status(400).json({ msg: 'Details Missing', success: false });

    const connectionId = makeConnectionId(UserId, friendId);

    const followDoc = await FriendsModel.findOne({ ConnectionId: connectionId });
    const requestDoc = await FollowRequests.findOne({
      RequestId: connectionId,
      Status: 'Notified',
    });

    const followExists = !!followDoc;
    const isSender = followExists && followDoc.SenderId.toString() === UserId;
    const isReceiver = followExists && followDoc.RecieverId.toString() === UserId;

    if (accountType === 'Public') {
      if (!followExists) {
        return res
          .status(200)
          .json({ msg: 'Not Following', success: true, status: 'NotFollowing' });
      }

      if (isSender && followDoc.Type.includes('Following')) {
        if (followDoc.FollowBack && followDoc.Type.includes('Follower')) {
          return res
            .status(200)
            .json({ msg: 'Following', success: true, status: 'Following' });
        }
        return res
          .status(200)
          .json({ msg: 'Following', success: true, status: 'Following' });
      }

      if (isReceiver) {
        if (
          followDoc.FollowBack &&
          followDoc.Type.includes('Follower') &&
          followDoc.Type.includes('Following')
        ) {
          return res
            .status(200)
            .json({ msg: 'Following', success: true, status: 'Following' });
        }
        return res
          .status(200)
          .json({ msg: 'They follow you', success: true, status: 'FollowBack' });
      }

      return res
        .status(200)
        .json({ msg: 'Not Following', success: true, status: 'NotFollowing' });
    }

    if (accountType === 'Private') {
      if (requestDoc) {
        if (requestDoc.SenderId.toString() === UserId) {
          return res
            .status(200)
            .json({ msg: 'Follow Requested', success: true, status: 'Requested' });
        }
        if (requestDoc.RecieverId.toString() === UserId) {
          return res
            .status(200)
            .json({ msg: 'Follow Requested', success: true, status: 'Accept' });
        }
      }

      if (followExists) {
        if (isSender && followDoc.Type.includes('Following')) {
          return res
            .status(200)
            .json({ msg: 'Following', success: true, status: 'Following' });
        }
        if (isReceiver) {
          if (followDoc.FollowBack && followDoc.Type.includes('Follower')) {
            return res
              .status(200)
              .json({ msg: 'Following', success: true, status: 'Following' });
          }
          return res
            .status(200)
            .json({ msg: 'They follow you', success: true, status: 'FollowBack' });
        }
      }

      return res
        .status(200)
        .json({ msg: 'Not Following', success: true, status: 'NotFollowing' });
    }

    return res.status(400).json({ msg: 'Invalid accountType', success: false });
  } catch (error) {
    console.error('CheckProfile error:', error);
    return res.status(500).json({ msg: 'Internal Server Error', success: false });
  }
};
