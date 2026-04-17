import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const HRDashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [showBasketOnly, setShowBasketOnly] = useState(false);
  const [filters, setFilters] = useState({
    desired_position: '',
    status: '',
    min_salary: '',
    max_salary: '',
    work_format: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, [showBasketOnly]);

  const fetchResumes = async () => {
    try {
      const params = new URLSearchParams();
      if (showBasketOnly) params.append('in_basket', 'true');
      if (filters.desired_position) params.append('desired_position', filters.desired_position);
      if (filters.status) params.append('status', filters.status);
      if (filters.min_salary) params.append('min_salary', filters.min_salary);
      if (filters.max_salary) params.append('max_salary', filters.max_salary);
      if (filters.work_format) params.append('work_format', filters.work_format);
      
      const url = '/resumes/?' + params.toString();
      const resp = await api.get(url);
      setResumes(resp.data);
    } catch (err) {
      alert('Ошибка загрузки резюме');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchResumes();
  };

  const resetFilters = () => {
    setFilters({
      desired_position: '',
      status: '',
      min_salary: '',
      max_salary: '',
      work_format: ''
    });
    setShowBasketOnly(false);
    fetchResumes();
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
          {showBasketOnly ? 'Показать все' : 'Показать только кандидатов'}
        </button>
      </div>

      <div className="filters-panel">
        <input
          type="text"
          name="desired_position"
          placeholder="Должность"
          value={filters.desired_position}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
          <option value="">Все статусы</option>
          <option value="В поиске">В поиске</option>
          <option value="На рассмотрении">На рассмотрении</option>
          <option value="Собеседование назначено">Собеседование назначено</option>
          <option value="Собеседование пройдено">Собеседование пройдено</option>
          <option value="Оффер">Оффер</option>
          <option value="Принят">Принят</option>
          <option value="Отказ">Отказ</option>
          <option value="Резерв">Резерв</option>
        </select>
        <input
          type="number"
          name="min_salary"
          placeholder="Зарплата от"
          value={filters.min_salary}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          name="max_salary"
          placeholder="до"
          value={filters.max_salary}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select name="work_format" value={filters.work_format} onChange={handleFilterChange} className="filter-select">
          <option value="">Любой формат</option>
          <option value="Офис">Офис</option>
          <option value="Гибрид">Гибрид</option>
          <option value="Удаленно">Удаленно</option>
        </select>
        <button onClick={applyFilters} className="btn-primary">Применить</button>
        <button onClick={resetFilters} className="btn-outline">Сбросить</button>
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