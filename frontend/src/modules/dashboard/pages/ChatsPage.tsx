import DashboardLayout from '../../../layouts/DashboardLayout';

import ChatSidebar from '../components/chat/ChatSidebar';
import ChatContainer from '../components/chat/ChatContainer';

export default function ChatsPage() {
  return (
    <DashboardLayout>

      <div className="flex h-full overflow-hidden">

        {/* CHAT SIDEBAR */}
        <ChatSidebar />

        {/* CHAT CONTAINER */}
        <div className="flex-1 overflow-hidden">

          <ChatContainer />
        </div>
      </div>
    </DashboardLayout>
  );
}