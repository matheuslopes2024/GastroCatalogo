import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';

type AdminStatusType = {
  isOnline: boolean;
  onlineAdmins: number[];
  acceptedByAdmin: boolean;
  adminId?: number;
  conversationAccepted?: number;
};

type AdminStatusContextType = {
  adminStatus: AdminStatusType;
  resetAcceptedStatus: () => void;
};

const AdminStatusContext = createContext<AdminStatusContextType | undefined>(undefined);

export function AdminStatusProvider({ children }: { children: ReactNode }) {
  const [adminStatus, setAdminStatus] = useState<AdminStatusType>({
    isOnline: false,
    onlineAdmins: [],
    acceptedByAdmin: false
  });
  
  const { lastMessage: wsLastMessage } = useWebSocket();
  
  // Processar mensagens recebidas por WebSocket relacionadas ao status do admin
  useEffect(() => {
    if (!wsLastMessage) return;
    
    // Status do administrador
    if (wsLastMessage.type === 'admin_status') {
      setAdminStatus(prev => ({
        ...prev,
        isOnline: (wsLastMessage.onlineAdmins || []).length > 0,
        onlineAdmins: wsLastMessage.onlineAdmins || []
      }));
    }
    // Usuário online/offline
    else if (wsLastMessage.type === 'user_status_change') {
      // Atualizar status se for um administrador
      if (wsLastMessage.isAdmin) {
        setAdminStatus(prev => ({
          ...prev,
          isOnline: wsLastMessage.isOnline,
          onlineAdmins: wsLastMessage.isOnline 
            ? [...prev.onlineAdmins, wsLastMessage.userId]
            : prev.onlineAdmins.filter(id => id !== wsLastMessage.userId)
        }));
      }
    }
    // Administrador aceitou a conversa
    else if (wsLastMessage.type === 'conversation_accepted_by_admin') {
      setAdminStatus(prev => ({
        ...prev,
        acceptedByAdmin: true,
        adminId: wsLastMessage.adminId,
        conversationAccepted: wsLastMessage.conversationId
      }));
    }
  }, [wsLastMessage]);
  
  // Resetar status de aceitação (útil quando a conversa é encerrada)
  const resetAcceptedStatus = () => {
    setAdminStatus(prev => ({
      ...prev,
      acceptedByAdmin: false,
      adminId: undefined,
      conversationAccepted: undefined
    }));
  };
  
  return (
    <AdminStatusContext.Provider value={{ adminStatus, resetAcceptedStatus }}>
      {children}
    </AdminStatusContext.Provider>
  );
}

export function useAdminStatus() {
  const context = useContext(AdminStatusContext);
  
  if (!context) {
    // Criamos um contexto padrão se não estiver dentro do provider
    return {
      adminStatus: {
        isOnline: false,
        onlineAdmins: [],
        acceptedByAdmin: false
      },
      resetAcceptedStatus: () => {}
    };
  }
  
  return context;
}