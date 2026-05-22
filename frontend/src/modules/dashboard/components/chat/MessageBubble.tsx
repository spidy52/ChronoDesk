import { formatMessageTime } from '../../../../utils/formatMessageTime';
import { memo } from "react";
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMe: boolean;
  readAt: string | null;
  deliveredAt: string | null;
}

const MessageBubble = memo(
  ({ content, createdAt, isMe, readAt, deliveredAt }: MessageBubbleProps) => {
    return (
      <div className={`flex w-full mb-2 group ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative max-w-[75%] px-4 py-2.5 shadow-sm ${
            isMe
              ? "bg-primary text-primary-foreground rounded-[22px] rounded-br-[6px]"
              : "bg-card border border-border/40 text-foreground rounded-[22px] rounded-bl-[6px]"
          }`}
        >
          <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
            {content}
          </p>
          
          <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? "justify-end text-primary-foreground/70" : "justify-start text-muted-foreground"}`}>
            <span className="text-[10px] font-medium tracking-wide">
              {formatMessageTime(createdAt)}
            </span>
            {isMe && (
              <span className="flex items-center">
                {readAt ? (
                  <CheckCheck size={14} className="text-blue-300" />
                ) : deliveredAt ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
