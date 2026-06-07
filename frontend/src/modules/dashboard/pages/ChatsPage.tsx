import { useChatStore } from '../store/useChatStore';
import DashboardLayout from '../../../layouts/DashboardLayout';

import ChatSidebar from '../components/chat/ChatSidebar';
import ChatContainer from '../components/chat/ChatContainer';

export default function ChatsPage() {
  const { currentChat } = useChatStore();

  return (
    <DashboardLayout>
      <div className="flex h-full overflow-hidden">
        {/* CHAT SIDEBAR */}
        <ChatSidebar />

        {/* CHAT CONTAINER */}
        <div className={`flex-1 overflow-hidden ${!currentChat ? 'hidden md:block' : 'block'}`}>
          <ChatContainer />
        </div>
      </div>
    </DashboardLayout>
  );
}