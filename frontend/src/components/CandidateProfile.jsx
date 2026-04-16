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

  return (
    <div style={{ padding: 20 }}>
      <h2>Моё резюме</h2>
      <form onSubmit={handleSubmit}>
        <input name="desired_position" placeholder="Желаемая должность" value={form.desired_position} onChange={handleChange} required />
        <input name="salary_expectation" type="number" placeholder="Зарплатные ожидания" value={form.salary_expectation} onChange={handleChange} />
        <input name="employment_type" placeholder="Тип занятости" value={form.employment_type} onChange={handleChange} />
        <input name="work_format" placeholder="Формат работы" value={form.work_format} onChange={handleChange} />
        <textarea name="about" placeholder="О себе" value={form.about} onChange={handleChange} />
        <button type="submit">Сохранить резюме</button>
      </form>

      {resume && (
        <div>
          <h3>Загрузить документ</h3>
          <form onSubmit={handleFileUpload}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit">Загрузить</button>
          </form>

          <h3>Документы</h3>
          <ul>
            {resume.documents.map(doc => (
              <li key={doc.id}>
                {doc.filename}{' '}
                <a href={`http://localhost:8000/files/download/${doc.id}`} target="_blank" rel="noreferrer">Открыть</a>
                {' | '}
                <a href={`http://localhost:8000/files/download/${doc.id}?download=1`} target="_blank" rel="noreferrer">Скачать</a>
              </li>
            ))}
          </ul>

          <h3>Отзывы руководителей</h3>
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
                <p><strong>Оценка:</strong> {review.overall_score}/5</p>
                <p><strong>Сильные стороны:</strong> {review.strengths}</p>
                <p><strong>Слабые стороны:</strong> {review.weaknesses}</p>
                <p><strong>Комментарий:</strong> {review.comment}</p>
                <p><strong>Рекомендация:</strong> {review.recommendation}</p>
                <p><em>Дата: {new Date(review.created_at).toLocaleString()}</em></p>
              </div>
            ))
          ) : (
            <p>Отзывов пока нет</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;