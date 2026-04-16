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
    } catch (err) {
      alert('Ошибка');
    }
  };

  const role = localStorage.getItem('role');

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Уведомления</h2>
      {notifications.length === 0 && <p>Нет уведомлений</p>}
      <div>
        {notifications.map(n => (
          <div
            key={n.id}
            style={{
              border: '1px solid #ccc',
              margin: 10,
              padding: 10,
              backgroundColor: n.is_read ? '#f0f0f0' : '#fff9c4'
            }}
          >
            <h3>{n.title}</h3>
            <p>{n.message}</p>
            <small>
              {role === 'candidate' && n.sender && `От: ${n.sender.full_name}`}
              {role === 'hr' && n.recipient && `Кому: ${n.recipient.full_name}`}
              {' | '}
              {new Date(n.created_at).toLocaleString()}
            </small>
            {role === 'candidate' && !n.is_read && (
              <div>
                <button onClick={() => markAsRead(n.id)}>Отметить прочитанным</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;