import { create } from 'zustand';

interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string | null;
  username?: string;
  isOnline?: boolean;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;

  token: string | null;

  isAuthenticated: boolean;

  setAuth: (
    user: User,
    token: string
  ) => void;

  loadUser: () => void;

  updateUser: (user: User) => void;

  logout: () => void;
}

export const useAuthStore =
  create<AuthState>((set) => ({
    user: JSON.parse(
      localStorage.getItem(
        'user'
      ) || 'null'
    ),

    token:
      localStorage.getItem(
        'token'
      ),

    isAuthenticated:
      !!localStorage.getItem(
        'token'
      ),

    setAuth: (
      user,
      token
    ) => {
      localStorage.setItem(
        'token',
        token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );

      set({
        user,
        token,
        isAuthenticated: true,
      });
    },

    loadUser: () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const user =
        localStorage.getItem(
          'user'
        );

      if (token && user) {
        set({
          token,

          user: JSON.parse(
            user
          ),

          isAuthenticated: true,
        });
      }
    },

    updateUser: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },

    logout: () => {
      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );

      localStorage.removeItem(
        'activeWorkspaceId'
      );

      set({
        user: null,

        token: null,

        isAuthenticated: false,
      });
    },
  }));