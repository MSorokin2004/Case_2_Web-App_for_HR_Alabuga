import { useState, useEffect } from 'react';
import api from '../api';

const CandidateProfile = () => {
  const [resume, setResume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    desired_position: '',
    salary_expectation: '',
    employment_type: '',
    work_format: '',
    about: '',
    full_name: '',
    contacts: '',
    experience: '',
    education: '',
    skills: '',
    competencies: '',
    languages: '',
    work_places: '',
    projects: '',
    certificates: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchResume();
  }, []);

  useEffect(() => {
    if (resume) {
      fetchReviews();
    }
  }, [resume]);

  const fetchResume = async () => {
    try {
      const resp = await api.get('/resumes/me');
      setResume(resp.data);
      setForm({
        desired_position: resp.data.desired_position || '',
        salary_expectation: resp.data.salary_expectation || '',
        employment_type: resp.data.employment_type || '',
        work_format: resp.data.work_format || '',
        about: resp.data.about || '',
        full_name: resp.data.full_name || '',
        contacts: resp.data.contacts || '',
        experience: resp.data.experience || '',
        education: resp.data.education || '',
        skills: resp.data.skills || '',
        competencies: resp.data.competencies || '',
        languages: resp.data.languages || '',
        work_places: resp.data.work_places || '',
        projects: resp.data.projects || '',
        certificates: resp.data.certificates || ''
      });
    } catch (err) {
      // резюме ещё нет
    }
  };

  const fetchReviews = async () => {
    try {
      const resp = await api.get(`/reviews/resume/${resume.id}`);
      setReviews(resp.data);
    } catch (err) {
      console.error('Ошибка загрузки отзывов');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (resume) {
        await api.put('/resumes/me', form);
      } else {
        const resp = await api.post('/resumes', form);
        setResume(resp.data);
      }
      fetchResume();
      alert('Резюме сохранено');
    } catch (error) {
      alert('Ошибка сохранения резюме');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !resume) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/files/upload/${resume.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchResume();
      setFile(null);
    } catch (error) {
      alert('Ошибка загрузки файла');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Удалить документ?')) return;
    try {
      await api.delete(`/files/${docId}`);
      fetchResume();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="profile-container">
      <h2 className="page-title">Моё резюме</h2>
      
      {resume && (
        <div className="status-banner">
          Текущий статус: <strong>{resume.status}</strong>
        </div>
      )}

      <div className="resume-section">
        <h3 className="section-title">Основная информация</h3>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <label>ФИО</label>
            <input name="full_name" placeholder="Иванов Иван Иванович" value={form.full_name} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Контакты</label>
            <textarea name="contacts" placeholder="Телефон, email, Telegram..." value={form.contacts} onChange={handleChange} className="form-textarea" rows="2" />
          </div>
          <div className="form-row">
            <label>Желаемая должность *</label>
            <input name="desired_position" placeholder="Например, Frontend-разработчик" value={form.desired_position} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-row">
            <label>Зарплатные ожидания</label>
            <input name="salary_expectation" type="number" placeholder="Сумма в рублях" value={form.salary_expectation} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>График работы</label>
            <input name="employment_type" placeholder="Полная занятость, частичная..." value={form.employment_type} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Формат работы</label>
            <input name="work_format" placeholder="Офис, гибрид, удалённо" value={form.work_format} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Опыт работы</label>
            <textarea name="experience" placeholder="Опишите ваш опыт работы" value={form.experience} onChange={handleChange} className="form-textarea" rows="4" />
          </div>
          <div className="form-row">
            <label>Образование</label>
            <textarea name="education" placeholder="Учебные заведения, специальность" value={form.education} onChange={handleChange} className="form-textarea" rows="3" />
          </div>
          <div className="form-row">
            <label>Навыки</label>
            <textarea name="skills" placeholder="Перечислите профессиональные навыки" value={form.skills} onChange={handleChange} className="form-textarea" rows="2" />
          </div>
          <div className="form-row">
            <label>Компетенции</label>
            <textarea name="competencies" placeholder="Ключевые компетенции" value={form.competencies} onChange={handleChange} className="form-textarea" rows="2" />
          </div>
          <div className="form-row">
            <label>Владение языками</label>
            <textarea name="languages" placeholder="Например, Английский B2, Немецкий A1" value={form.languages} onChange={handleChange} className="form-textarea" rows="2" />
          </div>
          <div className="form-row">
            <label>Места работы (предпочтения)</label>
            <input name="work_places" placeholder="Город, готовность к переезду" value={form.work_places} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <label>Проекты</label>
            <textarea name="projects" placeholder="Опишите реализованные проекты" value={form.projects} onChange={handleChange} className="form-textarea" rows="3" />
          </div>
          <div className="form-row">
            <label>Сертификаты</label>
            <textarea name="certificates" placeholder="Названия и даты получения" value={form.certificates} onChange={handleChange} className="form-textarea" rows="2" />
          </div>
          <div className="form-row">
            <label>О себе (дополнительно)</label>
            <textarea name="about" placeholder="Любая дополнительная информация" value={form.about} onChange={handleChange} className="form-textarea" rows="3" />
          </div>
          <button type="submit" className="btn-primary">Сохранить резюме</button>
        </form>
      </div>

      {resume && (
        <>
          <div className="resume-section">
            <h3 className="section-title">Документы</h3>
            <form onSubmit={handleFileUpload} className="upload-form">
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="file-input" />
              <button type="submit" className="btn-secondary">Загрузить</button>
            </form>
            <ul className="documents-list">
              {resume.documents.map(doc => (
                <li key={doc.id} className="document-item">
                  <span className="doc-filename">{doc.filename}</span>
                  <div className="doc-actions">
                    <a href={`http://localhost:8000/files/download/${doc.id}`} target="_blank" rel="noreferrer" className="doc-link">Открыть</a>
                    <a href={`http://localhost:8000/files/download/${doc.id}?download=1`} className="doc-link">Скачать</a>
                    <button onClick={() => handleDeleteDocument(doc.id)} className="doc-delete">Удалить</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="resume-section">
            <h3 className="section-title">Отзывы руководителей</h3>
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="review-score">{review.overall_score}/5</span>
                    <span className="review-recommendation">{review.recommendation}</span>
                  </div>
                  <p><strong>Сильные стороны:</strong> {review.strengths}</p>
                  <p><strong>Слабые стороны:</strong> {review.weaknesses}</p>
                  <p><strong>Комментарий:</strong> {review.comment}</p>
                  <p className="review-date">{new Date(review.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : <p>Отзывов пока нет</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default CandidateProfile;