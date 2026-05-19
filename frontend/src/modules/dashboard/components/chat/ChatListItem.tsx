import { memo } from 'react';
import type { Chat } from '../../store/useChatStore';

interface OtherUser {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  otherUser: OtherUser | undefined;
  onClick: () => void;
}

const ChatListItem = memo(
  ({ chat, isActive, otherUser, onClick }: ChatListItemProps) => {
    const initials = (otherUser?.name || 'U').charAt(0).toUpperCase();

    return (
      <button
        onClick={onClick}
        className={`w-full p-3 flex items-center gap-3 rounded-2xl transition-all ${
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
        }`}
      >
        {/* AVATAR */}
        <div className="relative flex-shrink-0">
          {otherUser?.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-12 h-12 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {initials}
            </div>
          )}
          {chat.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate text-sm">
              {otherUser?.name || 'Unknown'}
            </h3>
            {chat.lastMessage?.createdAt && (
              <span className="text-xs opacity-50 flex-shrink-0 ml-2">
                {new Date(chat.lastMessage.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm opacity-70 truncate flex-1">
              {chat.lastMessage?.content || 'No messages yet'}
            </p>
            {chat.unreadCount > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }
);

ChatListItem.displayName = 'ChatListItem';

export default ChatListItem;
