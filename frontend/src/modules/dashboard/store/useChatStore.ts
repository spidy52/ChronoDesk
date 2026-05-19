import { create } from 'zustand';

import toast from 'react-hot-toast';

import axiosInstance from '../../../lib/axios';

import { useAuthStore } from '../../auth/store';

import { socket } from '../../../services/socket';

/* ================= TYPES ================= */

interface User {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface LastMessageType {
  content: string;

  createdAt: string;

  senderId: string;

  readAt: string | null;

  deliveredAt: string | null;
}

export interface Chat {
  _id: string;

  participants: User[];

  lastMessage: LastMessageType | null;

  updatedAt: string;

  unreadCount: number;

  isOnline?: boolean;
}

export interface Message {
  _id: string;

  chatId: string;

  content: string;

  senderId: string;

  createdAt: string;

  deliveredAt: string | null;

  readAt: string | null;
}

/* ================= ACK ================= */

type AckResponse<T> =
  | {
      success: false;

      error: string;
    }
  | {
      success: true;

      message: T;
    };

/* ================= STORE ================= */

interface ChatStore {
  chats: Chat[];

  messages: Record<
    string,
    Message[]
  >;

  currentChat: Chat | null;

  isLoading: boolean;

  socketInitialized: boolean;

  setCurrentChat: (
    chat: Chat | null
  ) => void;

  fetchChats: () => Promise<void>;

  fetchMessages: (
    chatId: string
  ) => Promise<void>;

  sendMessage: (
    chatId: string,
    content: string
  ) => void;

  markAsRead: (
    chatId: string,
    otherUserId: string
  ) => void;

  deleteChat: (
    chatId: string
  ) => Promise<void>;

  initSocket: () => void;

  cleanupSocket: () => void;

  reset: () => void;
}

/* ================= STORE ================= */

export const useChatStore =
  create<ChatStore>(
    (set, get) => ({
      chats: [],

      messages: {},

      currentChat: null,

      isLoading: false,

      socketInitialized: false,

      /* ================= CURRENT CHAT ================= */

      setCurrentChat: (
        chat
      ) =>
        set({
          currentChat: chat,
        }),

      /* ================= FETCH CHATS ================= */

      fetchChats: async () => {
        set({
          isLoading: true,
        });

        try {
          const { data } =
            await axiosInstance.get(
              '/chats'
            );

          if (!data.success) {
            throw new Error(
              data.error
            );
          }

          const chats =
            data.chats.sort(
              (
                a: Chat,
                b: Chat
              ) =>
                +new Date(
                  b.updatedAt
                ) -
                +new Date(
                  a.updatedAt
                )
            );

          set({ chats });
        } catch (error) {
          console.error(error);

          toast.error(
            'Failed to load chats'
          );
        } finally {
          set({
            isLoading: false,
          });
        }
      },

      /* ================= FETCH MESSAGES ================= */

      fetchMessages:
        async (chatId) => {
          set({
            isLoading: true,
          });

          try {
            const { data } =
              await axiosInstance.get(
                `/chats/${chatId}/messages`
              );

            if (
              !data.success
            ) {
              throw new Error(
                data.error
              );
            }

            const sorted =
              [
                ...data.messages,
              ].sort(
                (
                  a: Message,
                  b: Message
                ) =>
                  +new Date(
                    a.createdAt
                  ) -
                  +new Date(
                    b.createdAt
                  )
              );

            set((state) => ({
              messages: {
                ...state.messages,

                [chatId]:
                  sorted,
              },
            }));
          } catch (error) {
            console.error(error);

            toast.error(
              'Failed to load messages'
            );
          } finally {
            set({
              isLoading: false,
            });
          }
        },

      /* ================= SEND MESSAGE ================= */

      sendMessage: (
        chatId,
        content
      ) => {
        if (
          !socket.connected
        ) {
          toast.error(
            'Socket disconnected'
          );

          return;
        }

        const user =
          useAuthStore.getState()
            .user;

        if (!user?.id && !user?._id) {
          toast.error(
            'User not authenticated'
          );

          return;
        }

        const trimmed =
          content.trim();

        if (!trimmed)
          return;

        const tempId = `temp-${Date.now()}`;

        const optimisticMessage: Message =
          {
            _id: tempId,

            chatId,

            content:
              trimmed,

            senderId:
              user.id || user._id || '',

            createdAt:
              new Date().toISOString(),

            deliveredAt:
              null,

            readAt: null,
          };

        /* OPTIMISTIC UPDATE */

        set((state) => ({
          messages: {
            ...state.messages,

            [chatId]: [
              ...(state
                .messages[
                chatId
              ] || []),

              optimisticMessage,
            ],
          },
        }));

        /* SOCKET EMIT */

        socket.emit(
          'message:send',

          {
            chatId,

            senderId:
              user.id || user._id || '',

            content:
              trimmed,
          },

          (
            response: AckResponse<Message>
          ) => {
          if (!response.success) {
  toast.error(
    'error' in response
      ? response.error
      : 'Failed to send message'
  );

  return;
}

            const serverMessage =
              response.message;

            set(
              (state) => ({
                messages:
                  {
                    ...state.messages,

                    [chatId]:
                      state.messages[
                        chatId
                      ].map(
                        (
                          m
                        ) =>
                          m._id ===
                          tempId
                            ? serverMessage
                            : m
                      ),
                  },
              })
            );
          }
        );
      },

      /* ================= MARK READ ================= */

      markAsRead: (
        chatId,
        otherUserId
      ) => {
        socket.emit(
          'chat:read',
          {
            chatId,

            otherUserId,
          }
        );

        set((state) => ({
          chats:
            state.chats.map(
              (chat) =>
                chat._id ===
                chatId
                  ? {
                      ...chat,

                      unreadCount: 0,
                    }
                  : chat
            ),
        }));
      },

      /* ================= DELETE CHAT ================= */

      deleteChat:
        async (chatId) => {
          try {
            const { data } =
              await axiosInstance.delete(
                `/chats/${chatId}`
              );

            if (
              !data.success
            ) {
              throw new Error(
                data.error
              );
            }

            set((state) => ({
              chats:
                state.chats.filter(
                  (
                    chat
                  ) =>
                    chat._id !==
                    chatId
                ),

              messages:
                {
                  ...state.messages,

                  [chatId]:
                    [],
                },

              currentChat:
                state
                  .currentChat
                  ?._id ===
                chatId
                  ? null
                  : state.currentChat,
            }));

            toast.success(
              'Chat deleted'
            );
          } catch (error) {
            console.error(error);

            toast.error(
              'Failed to delete chat'
            );
          }
        },

      /* ================= SOCKET INIT ================= */

      initSocket: () => {
        get().cleanupSocket();

        socket.on(
          'message:received',

          (
            message: Message
          ) => {
            set(
              (state) => ({
                messages:
                  {
                    ...state.messages,

                    [message.chatId]:
                      [
                        ...(state
                          .messages[
                          message
                            .chatId
                        ] ||
                          []),

                        message,
                      ],
                  },
              })
            );
          }
        );

        set({
          socketInitialized: true,
        });
      },

      /* ================= SOCKET CLEANUP ================= */

      cleanupSocket: () => {
        socket.off(
          'message:received'
        );

        socket.off(
          'message:delivered'
        );

        socket.off(
          'chat:messageRead'
        );

        socket.off(
          'user:online'
        );

        socket.off(
          'user:offline'
        );
      },

      /* ================= RESET ================= */

      reset: () => {
        get().cleanupSocket();

        set({
          chats: [],

          messages: {},

          currentChat: null,

          isLoading: false,

          socketInitialized: false,
        });
      },
    })
  );