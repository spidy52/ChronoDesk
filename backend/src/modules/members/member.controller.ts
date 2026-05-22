import {
  Request,
  Response,
} from 'express';
import { io } from '../../index';

import Members
from '../../models/Member';

import User
from '../../models/User';

/* ================= SEND INVITATION ================= */

export const sendInvitation =
  async (
    req: any,
    res: Response
  ) => {

    try {

      const {
        username,
        role,
      } = req.body;

      const senderId =
        req.user.userId;

      if (!username) {

        return res.status(400).json({
          error:
            'Username is required',
        });
      }

      const targetUser =
        await User.findOne({
          username:
            username.toLowerCase(),
        });

      if (!targetUser) {

        return res.status(404).json({
          error:
            'User not found',
        });
      }

      if (
        targetUser._id.toString() ===
        senderId
      ) {

        return res.status(400).json({
          error:
            'Cannot invite yourself',
        });
      }

      const existingInvite =
        await Members.findOne({
          $or: [
            { fromUser: senderId, toUser: targetUser._id },
            { fromUser: targetUser._id, toUser: senderId }
          ],
          status: {
            $in: [
              'pending',
              'accepted',
            ],
          },
        });

      if (existingInvite) {

        return res.status(400).json({
          error:
            'Invitation already exists',
        });
      }

      const invite =
        await Members.create({
          fromUser:
            senderId,

          toUser:
            targetUser._id,
            
          role: role || 'Member',

          status:
            'pending',
        });

      res.json({
        message:
          'Invitation sent successfully',

        invite,
      });

      // Emit real-time event to the target user
      io.to(targetUser._id.toString()).emit('invitation:sent', invite);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= GET INVITATIONS ================= */

export const getInvitations =
  async (
    req: any,
    res: Response
  ) => {

    try {

      const invitations =
        await Members.find({
          toUser:
            req.user.userId,

          status:
            'pending',
        })

          .populate(
            'fromUser',
            'name username email'
          )

          .sort({
            createdAt:
              -1,
          });

      res.json(
        invitations
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= ACCEPT INVITATION ================= */

export const acceptInvitation =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const updatedInvite = await Members.findByIdAndUpdate(
        req.params.id,
        {
          status:
            'accepted',
        },
        { new: true }
      ).populate('fromUser', 'name username email isOnline').populate('toUser', 'name username email isOnline');

      res.json({
        message:
          'Invitation accepted',
      });

      if (updatedInvite) {
        io.to(updatedInvite.fromUser._id.toString()).emit('invitation:accepted', updatedInvite);
      }

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= REJECT INVITATION ================= */

export const rejectInvitation =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const updatedInvite = await Members.findByIdAndUpdate(
        req.params.id,
        {
          status:
            'rejected',
        },
        { new: true }
      );

      res.json({
        message:
          'Invitation rejected',
      });

      if (updatedInvite) {
        io.to(updatedInvite.fromUser.toString()).emit('invitation:rejected', updatedInvite);
      }

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= GET ACCEPTED MEMBERS ================= */

export const getMembers =
  async (
    req: any,
    res: Response
  ) => {

    try {

      const members =
        await Members.find({
          $or: [
            {
              fromUser:
                req.user.userId,
            },

            {
              toUser:
                req.user.userId,
            },
          ],

          status:
            'accepted',
        })

          .populate(
            'fromUser',
            'name username email isOnline'
          )

          .populate(
            'toUser',
            'name username email isOnline'
          );

      const formattedMembers = members.map((member: any) => {
        const otherUser =
          member.fromUser._id.toString() === req.user.userId
            ? member.toUser
            : member.fromUser;

        return {
          _id: member._id, // Membership ID for deletions
          userId: otherUser._id,
          name: otherUser.name || 'Unknown',
          username: otherUser.username,
          email: otherUser.email,
          role: member.role,
          status: otherUser.isOnline ? 'Online' : 'Offline',
        };
      });

      res.json(
        formattedMembers
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          'Internal server error',
      });
    }
  };

/* ================= REMOVE MEMBER ================= */

export const removeMember = async (req: any, res: Response) => {
  try {
    const member = await Members.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (
      member.fromUser.toString() !== req.user.userId &&
      member.toUser.toString() !== req.user.userId
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Members.findByIdAndDelete(req.params.id);

    res.json({ message: 'Member removed successfully' });

    // Emit to both so they can update their UI
    io.to(member.fromUser.toString()).emit('member:removed', req.params.id);
    io.to(member.toUser.toString()).emit('member:removed', req.params.id);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};