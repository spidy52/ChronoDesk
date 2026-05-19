import { useState, useRef, useEffect } from "react";
import { useChatStore } from '../../store/useChatStore';
import { Send } from "lucide-react";

const MessageInput = () => {
  const { currentChat, sendMessage } = useChatStore();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [content]);

  if (!currentChat) return null;

  const handleSend = () => {
    if (!content.trim()) return;

    sendMessage(currentChat._id, content);
    setContent("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-base-100 border-t border-base-300 px-4 py-3 flex-shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none max-h-[120px] overflow-y-auto"
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          onClick={handleSend}
          className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
            content.trim()
              ? "bg-primary hover:bg-primary/90 text-primary-content"
              : "bg-base-300 text-base-content/40 cursor-not-allowed"
          }`}
          disabled={!content.trim()}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
