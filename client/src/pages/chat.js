import Layout from '../components/AppShell/Layout';
import Sidebar from '../components/AppShell/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';

export default function ChatPage() {
  return (
    <Layout showSidebar={true} sidebarComponent={<Sidebar />}>
      <ChatWindow />
    </Layout>
  );
}
