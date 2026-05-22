import { api }
from '../lib/axios';

/* ================= SEND INVITE ================= */

export const sendInvitation =
  async (
    username: string
  ) => {

    const response =
      await api.post(
        '/members/invite',
        {
          username,
        }
      );

    return response.data;
  };

/* ================= GET INVITATIONS ================= */

export const fetchInvitations =
  async () => {

    const response =
      await api.get(
        '/members/invitations'
      );

    return response.data;
  };

/* ================= ACCEPT ================= */

export const acceptInvitation =
  async (
    id: string
  ) => {

    const response =
      await api.patch(
        `/members/accept/${id}`
      );

    return response.data;
  };

/* ================= REJECT ================= */

export const rejectInvitation =
  async (
    id: string
  ) => {

    const response =
      await api.patch(
        `/members/reject/${id}`
      );

    return response.data;
  };

/* ================= MEMBERS ================= */

export const fetchMembers =
  async () => {

    const response =
      await api.get(
        '/members'
      );

    return response.data;
  };