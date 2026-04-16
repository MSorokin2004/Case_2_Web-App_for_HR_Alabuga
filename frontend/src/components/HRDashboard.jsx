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
    <div style={{ padding: 20 }}>
      <h2>Кандидаты</h2>
      <button onClick={handleToggleBasketFilter}>
        {showBasketOnly ? 'Показать все' : 'Показать только корзину'}
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 20 }}>
        {resumes.map(resume => (
          <div
            key={resume.id}
            style={{
              border: '1px solid #ccc',
              margin: 10,
              padding: 15,
              width: 220,
              cursor: 'pointer',
              backgroundColor: resume.in_basket ? '#f0f0c0' : 'white'
            }}
            onClick={() => handleCardClick(resume.id)}
          >
            <h3>{resume.candidate.full_name}</h3>
            <p><strong>{resume.desired_position}</strong></p>
            <p>Зарплата: {resume.salary_expectation}</p>
            <p>Статус: {resume.status}</p>
            <p>{resume.in_basket ? '🛒 В корзине' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDashboard;