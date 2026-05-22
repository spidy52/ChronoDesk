import { useState, useRef, useEffect } from "react";
import { useChatStore } from '../../store/useChatStore';
import { Send, Smile, Paperclip } from "lucide-react";

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
    <div className="bg-card/80 backdrop-blur-md border-t border-border/50 p-4 pt-3 flex-shrink-0 z-20 relative">
      <div className="max-w-4xl mx-auto flex items-end gap-3 bg-background border border-border/80 rounded-[28px] p-2 pr-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all duration-200">
        
        <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors flex-shrink-0 mb-0.5">
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          placeholder="Message..."
          className="flex-1 py-3 bg-transparent focus:outline-none text-[15px] resize-none max-h-[120px] overflow-y-auto placeholder:text-muted-foreground/60 leading-relaxed"
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors flex-shrink-0 mb-0.5 hidden sm:flex">
          <Smile size={20} />
        </button>

        <button
          onClick={handleSend}
          className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 mb-0.5 flex items-center justify-center ${
            content.trim()
              ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 scale-100"
              : "bg-secondary text-muted-foreground scale-95 opacity-80 cursor-not-allowed"
          }`}
          disabled={!content.trim()}
        >
          <Send size={18} className={content.trim() ? "ml-0.5" : ""} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
