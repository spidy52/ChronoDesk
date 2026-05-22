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
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-background/30">
        <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center animate-pulse">
          <span className="text-5xl opacity-80">💬</span>
        </div>
        <p className="text-lg font-medium tracking-tight">Select a chat to start messaging</p>
      </div>
    );
  }

  const chatMessages = messages[currentChat._id] || [];
  const myId = user?.id || user?._id;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/50 relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      
      <ChatHeader />

      {isLoading && chatMessages.length === 0 ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scroll-smooth z-10 flex flex-col">
          {chatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-60">
              <span className="text-4xl mb-4">👋</span>
              <p className="text-sm font-medium">Say hello to start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
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
            })
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
