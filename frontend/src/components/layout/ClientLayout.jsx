import {
  LayoutDashboard,
  User,
  FileText,
  Scale,
  Bell,
  Scale as GavelIcon,
} from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Chatbot } from '../client/Chatbot';
import clientApi from '../../api/clientApi';

const clientNavItems = [
  { to: '/client', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/client/documents', label: 'Documents', icon: FileText },
  { to: '/client/cases', label: 'Case Tracking', icon: Scale },
  { to: '/client/advocate', label: 'My Advocate', icon: GavelIcon },
  { to: '/client/notifications', label: 'Notifications', icon: Bell },
  { to: '/client/profile', label: 'Profile', icon: User },
];

export function ClientLayout({ children }) {
  const [chatHistory, setChatHistory] = useState([]);

  const handleSendMessage = async (message) => {
    setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
    try {
      const response = await clientApi.sendChatMessage(message);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.reply ||
            response.message ||
            'I received your question. Our team will get back to you shortly.',
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not process your request. Please try again later.',
        },
      ]);
    }
  };

  return (
    <>
      <DashboardLayout navItems={clientNavItems} portalName="Client Portal">
        {children}
      </DashboardLayout>
      <Chatbot onSendMessage={handleSendMessage} chatHistory={chatHistory} />
    </>
  );
}

export default ClientLayout;
