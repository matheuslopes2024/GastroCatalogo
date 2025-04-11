import React from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import AdminChatDashboard from '@/components/admin/admin-chat-dashboard';
import { AdminChatProvider } from '@/hooks/use-admin-chat';

export default function ChatAdminPage() {
  return (
    <AdminChatProvider>
      <AdminLayout 
        title="Chat de Suporte" 
        breadcrumbs={[{ title: 'Chat', href: '/admin/chat' }]}
      >
        <div className="h-[calc(100vh-185px)]">
          <AdminChatDashboard />
        </div>
      </AdminLayout>
    </AdminChatProvider>
  );
}