import { useEffect, useState } from 'react';
import api from '../api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const resp = await api.get('/notifications/');
      setNotifications(resp.data);
    } catch (err) {
      alert('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifs =>
        notifs.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      window.dispatchEvent(new Event('unread-updated'));
    } catch (err) {
      alert('Ошибка');
    }
  };

  const respondToInterview = async (interviewId, response, notificationId) => {
    try {
      await api.post(`/interviews/${interviewId}/respond?response=${response}`);
      await api.post(`/notifications/${notificationId}/read`);
      alert('Ответ отправлен');
      fetchNotifications();
      window.dispatchEvent(new Event('unread-updated'));
    } catch (err) {
      alert('Ошибка');
    }
  };

  const role = localStorage.getItem('role');

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="notifications-container">
      <h2 className="page-title">Уведомления</h2>
      {notifications.length === 0 ? (
        <p className="empty-state">Нет уведомлений</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-card ${!n.is_read ? 'unread' : ''}`}>
              <div className="notification-header">
                <h3 className="notification-title">{n.title}</h3>
                {!n.is_read && <span className="unread-badge">Новое</span>}
              </div>
              <p className="notification-message">{n.message}</p>
              <div className="notification-meta">
                <span>
                  {role === 'candidate' && n.sender && `От: ${n.sender.full_name}`}
                  {(role === 'hr' || role === 'manager') && n.sender && `От: ${n.sender.full_name}`}
                </span>
                <span>{new Date(n.created_at).toLocaleString()}</span>
              </div>
                  {(role === 'candidate' || role === 'hr' || role === 'manager') && !n.is_read && (
                    <div className="notification-actions">
                      <button onClick={() => markAsRead(n.id)} className="btn-outline">Отметить прочитанным</button>
                    </div>
                  )}
              {role === 'candidate' && n.interview_id && n.title.includes('Приглашение') && !n.is_read && (
                <div className="notification-actions">
                  <button onClick={() => respondToInterview(n.interview_id, 'accept', n.id)} className="btn-success">Принять</button>
                  <button onClick={() => respondToInterview(n.interview_id, 'decline', n.id)} className="btn-danger">Отклонить</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;