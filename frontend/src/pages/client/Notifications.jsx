import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import clientApi from '../../api/clientApi';
import { NotificationPanel } from '../../components/client/NotificationPanel';
import { Loader } from '../../components/common/Loader';

export function ClientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
      try {
        setLoading(true);
        const response = await clientApi.getNotifications();
        const notifs = response.data?.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await clientApi.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n._id) === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await clientApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setError('Failed to mark all as read');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on your cases and legal matters.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {!loading && notifications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-700">No notifications</p>
          <p className="text-xs text-gray-500 mt-1">
            You'll receive alerts about your cases and documents here.
          </p>
        </div>
      )}
    </div>
  );
}

export default ClientNotifications;
