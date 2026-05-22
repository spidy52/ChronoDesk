import { useEffect, useState, useCallback, useRef } from 'react';

import { Search, X, MessageSquare } from 'lucide-react';

import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../../auth/store';
import { useSearchStore } from '../../store/useSearchStore';

import SearchContainer from './SearchContainer';
import ChatListItem from './ChatListItem';

import SidebarSkeleton from '../../../../components/skeletons/SidebarSkeleton';

const ChatSidebar = () => {
  const {
    chats,
    fetchChats,
    currentChat,
    setCurrentChat,
    isLoading,
  } = useChatStore();

  const { user } = useAuthStore();

  const {
    searchMode,
    enterSearchMode,
    exitSearchMode,
    searchUser,
  } = useSearchStore();

  const [searchInput, setSearchInput] =
    useState('');

  const hasFetchedRef = useRef(false);

  const debounceTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* ================= FETCH CHATS ================= */

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchChats();

      hasFetchedRef.current = true;
    }
  }, [fetchChats]);

  /* ================= GET OTHER USER ================= */

  const getOtherUser = useCallback(
    (chat: any) => {
      const myId = user?.id || user?._id;
      return chat.participants?.find(
        (p: any) => p._id !== myId
      );
    },
    [user?.id, user?._id]
  );

  /* ================= SEARCH ================= */

  useEffect(() => {
    if (!searchMode) return;

    if (debounceTimerRef.current) {
      clearTimeout(
        debounceTimerRef.current
      );
    }

    const trimmed =
      searchInput.trim();

    if (!trimmed) {
      searchUser('');

      return;
    }

    debounceTimerRef.current =
      setTimeout(() => {
        searchUser(trimmed);
      }, 300);

    return () => {
      if (
        debounceTimerRef.current
      ) {
        clearTimeout(
          debounceTimerRef.current
        );
      }
    };
  }, [
    searchInput,
    searchMode,
    searchUser,
  ]);

  /* ================= EXIT SEARCH ================= */

  const handleExitSearch =
    useCallback(() => {
      exitSearchMode();

      setSearchInput('');
    }, [exitSearchMode]);

  /* ================= LOADING ================= */

  if (isLoading && chats.length === 0) {
    return <SidebarSkeleton />;
  }

  return (
    <aside className="w-[360px] bg-card border-r flex flex-col h-full">

      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-5 border-b">

        {/* PROFILE */}
        <div className="flex items-center gap-3">

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || 'User'}
              className="w-10 h-10 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div>

            <h2 className="font-bold text-sm">
              {user?.name || 'User'}
            </h2>

            <p className="text-xs text-muted-foreground">
              Online
            </p>
          </div>
        </div>

        {/* LOGO */}
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">

          <MessageSquare size={18} />
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-4 border-b">

        <div className="relative">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="text"
            placeholder="Search chats..."
            value={searchInput}
            onChange={(e) =>
              setSearchInput(
                e.target.value
              )
            }
            onFocus={enterSearchMode}
            className="
              w-full
              h-11
              pl-10
              pr-10
              rounded-2xl
              bg-secondary
              outline-none
              text-sm
            "
          />

          {searchMode && (
            <button
              onClick={
                handleExitSearch
              }
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >

              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">

        {searchMode ? (
          <SearchContainer />
        ) : chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">

            No chats available
          </div>
        ) : (
          chats.map((chat: any) => {
            const other =
              getOtherUser(chat);

            const isActive =
              currentChat?._id ===
              chat._id;

            return (
              <ChatListItem
                key={chat._id}
                chat={chat}
                otherUser={other}
                isActive={isActive}
                onClick={() =>
                  setCurrentChat(chat)
                }
              />
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;