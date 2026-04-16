import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const HRDashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [showBasketOnly, setShowBasketOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, [showBasketOnly]);

  const fetchResumes = async () => {
    try {
      const url = showBasketOnly ? '/resumes/?in_basket=true' : '/resumes/';
      const resp = await api.get(url);
      setResumes(resp.data);
    } catch (err) {
      alert('Ошибка загрузки резюме');
    }
  };

  const handleCardClick = (resumeId) => {
    navigate(`/resume/${resumeId}`);
  };

  const handleToggleBasketFilter = () => {
    setShowBasketOnly(!showBasketOnly);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Кандидаты</h2>
        <button onClick={handleToggleBasketFilter} className="btn-secondary">
          {showBasketOnly ? 'Показать все' : 'Показать только корзину'}
        </button>
      </div>
      <div className="resume-grid">
        {resumes.map(resume => (
          <div
            key={resume.id}
            className={`resume-card ${resume.in_basket ? 'in-basket' : ''}`}
            onClick={() => handleCardClick(resume.id)}
          >
            <h3 className="resume-name">{resume.candidate.full_name}</h3>
            <p className="resume-position">{resume.desired_position}</p>
            <p className="resume-salary">Зарплата: {resume.salary_expectation} ₽</p>
            <p className="resume-status">Статус: {resume.status}</p>
            {resume.in_basket && <span className="basket-badge">В корзине</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDashboard;