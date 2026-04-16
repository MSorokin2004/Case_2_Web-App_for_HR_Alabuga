import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ResumeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumeDetail();
  }, [id]);

  const fetchResumeDetail = async () => {
    try {
      const resp = await api.get(`/resumes/${id}/detail`);
      setResume(resp.data);
    } catch (err) {
      alert('Не удалось загрузить резюме');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBasket = async () => {
    try {
      const resp = await api.post(`/resumes/${id}/basket`);
      setResume({ ...resume, in_basket: resp.data.in_basket });
    } catch (err) {
      alert('Ошибка при изменении корзины');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!resume) return <div>Резюме не найдено</div>;

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/dashboard')}>← Назад к списку</button>
      <h1>{resume.candidate.full_name}</h1>
      <p><strong>Желаемая должность:</strong> {resume.desired_position}</p>
      <p><strong>Зарплатные ожидания:</strong> {resume.salary_expectation}</p>
      <p><strong>Тип занятости:</strong> {resume.employment_type}</p>
      <p><strong>Формат работы:</strong> {resume.work_format}</p>
      <p><strong>О себе:</strong> {resume.about}</p>
      <p><strong>Статус:</strong> {resume.status}</p>
      <p>
        <strong>В корзине:</strong> {resume.in_basket ? 'Да' : 'Нет'}
        <button onClick={handleToggleBasket} style={{ marginLeft: 10 }}>
          {resume.in_basket ? 'Убрать из корзины' : 'Добавить в корзину'}
        </button>
      </p>

      <h2>Документы</h2>
      <ul>
        {resume.documents.map(doc => (
          <li key={doc.id}>
            {doc.filename}{' '}
            <a
              href={`http://localhost:8000/files/download/${doc.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Открыть
            </a>
            {' | '}
            <a
              href={`http://localhost:8000/files/download/${doc.id}?download=1`}
              target="_blank"
              rel="noreferrer"
            >
              Скачать
            </a>
          </li>
        ))}
      </ul>

      <h2>Отзывы руководителей</h2>
      {resume.reviews && resume.reviews.length > 0 ? (
        <div>
          {resume.reviews.map(review => (
            <div key={review.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
              <p><strong>Оценка:</strong> {review.overall_score}/5</p>
              <p><strong>Сильные стороны:</strong> {review.strengths}</p>
              <p><strong>Слабые стороны:</strong> {review.weaknesses}</p>
              <p><strong>Комментарий:</strong> {review.comment}</p>
              <p><strong>Рекомендация:</strong> {review.recommendation}</p>
              <p><em>Дата: {new Date(review.created_at).toLocaleString()}</em></p>
            </div>
          ))}
        </div>
      ) : (
        <p>Отзывов пока нет</p>
      )}
    </div>
  );
};

export default ResumeDetail;