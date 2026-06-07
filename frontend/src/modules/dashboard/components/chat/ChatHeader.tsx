import { X, Phone, Video, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../auth/store';
import { useChatStore } from '../../store/useChatStore';

const ChatHeader = () => {
  const { currentChat, setCurrentChat } = useChatStore();
  const { user } = useAuthStore();

  if (!currentChat) return null;

  const myId = user?.id || user?._id;
  const otherUser = currentChat.participants.find((p) => p._id !== myId);
  const initials = (otherUser?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="px-6 py-4 border-b flex items-center justify-between bg-card flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* BACK BUTTON (MOBILE ONLY) */}
        <button
          onClick={() => setCurrentChat(null)}
          className="md:hidden p-1 mr-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        {/* AVATAR */}
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

        {/* INFO */}
        <div>
          <h2 className="font-bold text-lg">{otherUser?.name || 'Unknown'}</h2>
          <p className={`text-sm ${otherUser?.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
            {otherUser?.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-2xl border hover:bg-secondary flex items-center justify-center transition-all">
          <Phone size={18} />
        </button>
        <button className="w-10 h-10 rounded-2xl border hover:bg-secondary flex items-center justify-center transition-all">
          <Video size={18} />
        </button>
        <button
          onClick={() => setCurrentChat(null)}
          className="hidden md:flex w-10 h-10 rounded-2xl border hover:bg-secondary items-center justify-center transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
