import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../../auth/store';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import MessageSkeleton from '../../../../components/skeletons/MessageSkeleton';

const ChatContainer = () => {
  const { currentChat, messages, fetchMessages, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChat?._id) return;
    fetchMessages(currentChat._id);
  }, [currentChat?._id, fetchMessages]);

  useEffect(() => {
    if (messagesEndRef.current && messages[currentChat?._id || '']) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, currentChat?._id]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
          <span className="text-4xl">💬</span>
        </div>
        <p className="text-lg font-medium">Select a chat to start messaging</p>
      </div>
    );
  }

  const chatMessages = messages[currentChat._id] || [];
  const myId = user?.id || user?._id;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatHeader />

      {isLoading && chatMessages.length === 0 ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {chatMessages.map((msg) => {
            const isMe = msg.senderId === myId;
            return (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                createdAt={msg.createdAt}
                isMe={isMe}
                readAt={msg.readAt}
                deliveredAt={msg.deliveredAt}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
