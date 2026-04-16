import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'candidate' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      alert('Registered! Please login.');
      window.location.href = '/login';
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Регистрация</h2>
        <div className="form-group">
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            name="password"
            type="password"
            placeholder="Пароль"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            name="full_name"
            placeholder="Полное имя"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <select name="role" onChange={handleChange} className="form-select">
            <option value="candidate">Кандидат</option>
            <option value="hr">HR</option>
            <option value="manager">Руководитель</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Зарегистрироваться</button>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;