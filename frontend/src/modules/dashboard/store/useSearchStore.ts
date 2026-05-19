import { create } from 'zustand';

import axiosInstance from '../../../lib/axios';

import { useChatStore } from './useChatStore';

import toast from 'react-hot-toast';

/* ================= TYPES ================= */

interface User {
  _id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
}

interface SearchResult {
  users: User[];

  notFound: boolean;
}

interface SearchState {
  searchMode: boolean;

  searchLoading: boolean;

  searchResult: SearchResult | null;

  enterSearchMode: () => void;

  exitSearchMode: () => void;

  searchUser: (
    username: string
  ) => Promise<void>;

  createChatWithUser: (
    username: string
  ) => Promise<void>;
}

/* ================= STORE ================= */

export const useSearchStore =
  create<SearchState>((set) => ({
    searchMode: false,

    searchLoading: false,

    searchResult: null,

    /* ================= ENTER SEARCH ================= */

    enterSearchMode: () => {
      set({
        searchMode: true,
        searchResult: null,
      });
    },

    /* ================= EXIT SEARCH ================= */

    exitSearchMode: () => {
      set({
        searchMode: false,
        searchResult: null,
      });
    },

    /* ================= SEARCH USER ================= */

    searchUser: async (
      username
    ) => {
      if (
        !username ||
        username.trim().length === 0
      ) {
        set({
          searchResult: null,
        });

        return;
      }

      set({
        searchLoading: true,
      });

      try {
        const { data } =
          await axiosInstance.post(
            '/users/search',
            {
              username:
                username.trim(),
            }
          );

        if (
          !data.success ||
          !data.users ||
          data.users.length === 0
        ) {
          set({
            searchResult: {
              users: [],
              notFound: true,
            },

            searchLoading: false,
          });

          return;
        }

        set({
          searchResult: {
            users: data.users,
            notFound: false,
          },

          searchLoading: false,
        });
      } catch (error) {
        console.error(
          'Search error:',
          error
        );

        set({
          searchResult: {
            users: [],
            notFound: true,
          },

          searchLoading: false,
        });
      }
    },

    /* ================= CREATE CHAT ================= */

    createChatWithUser:
      async (username) => {
        try {
          const { data } =
            await axiosInstance.post(
              '/chat/user',
              {
                otherUserName:
                  username,
              }
            );

          if (!data.success) {
            toast.error(
              'Failed to create chat'
            );

            return;
          }

          const newChat =
            data.chat;

          const chatStore =
            useChatStore.getState();

          const existingChat =
            chatStore.chats.find(
              (c: any) =>
                c._id ===
                newChat._id
            );

          /* ADD CHAT IF NOT EXISTS */

          if (!existingChat) {
            useChatStore.setState(
              (state: any) => ({
                chats: [
                  {
                    ...newChat,

                    unreadCount: 0,

                    isOnline: false,
                  },

                  ...state.chats,
                ],
              })
            );
          }

          /* SET CURRENT CHAT */

          chatStore.setCurrentChat(
            newChat
          );

          /* FETCH MESSAGES */

          await chatStore.fetchMessages(
            newChat._id
          );

          /* CLOSE SEARCH */

          set({
            searchMode: false,

            searchResult: null,
          });

          toast.success(
            'Chat opened'
          );
        } catch (error) {
          console.error(
            'Create chat error:',
            error
          );

          toast.error(
            'Failed to open chat'
          );
        }
      },
  }));