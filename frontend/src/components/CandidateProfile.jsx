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
    about: ''
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
        about: resp.data.about || ''
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
      fetchResume(); // обновить список документов
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  return (
    <div className="profile-container">
      <h2 className="page-title">Моё резюме</h2>
      
      <div className="resume-section">
        <h3 className="section-title">Основная информация</h3>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <input name="desired_position" placeholder="Желаемая должность" value={form.desired_position} onChange={handleChange} required className="form-input" />
          </div>
          <div className="form-row">
            <input name="salary_expectation" type="number" placeholder="Зарплатные ожидания" value={form.salary_expectation} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <input name="employment_type" placeholder="Тип занятости" value={form.employment_type} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <input name="work_format" placeholder="Формат работы" value={form.work_format} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-row">
            <textarea name="about" placeholder="О себе" value={form.about} onChange={handleChange} className="form-textarea" />
          </div>
          <button type="submit" className="btn-primary">Сохранить</button>
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