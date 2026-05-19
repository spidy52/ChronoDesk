import { formatMessageTime } from '../../../../utils/formatMessageTime';
import { memo } from "react";

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMe: boolean;
  readAt: string | null;
  deliveredAt: string | null;
}

const MessageBubble = memo(
  ({ content, createdAt, isMe, readAt, deliveredAt }: MessageBubbleProps) => {
    const getStatus = () => {
      if (readAt) return "Seen";
      if (deliveredAt) return "Delivered";
      return "Sent";
    };

    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] px-3 py-2 break-words ${
            isMe
              ? "bg-primary text-primary-content rounded-[16px] rounded-br-md"
              : "bg-base-100 rounded-[16px] rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-[1.4] whitespace-pre-wrap break-words">
            {content}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-[11px] opacity-60">
              {formatMessageTime(createdAt)}
            </span>
            {isMe && (
              <span className="text-[11px] opacity-60">{getStatus()}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
