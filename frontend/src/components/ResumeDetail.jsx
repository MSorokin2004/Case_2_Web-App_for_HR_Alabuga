import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ResumeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteTitle, setInviteTitle] = useState('Приглашение на собеседование');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    overall_score: 5,
    strengths: '',
    weaknesses: '',
    comment: '',
    recommendation: 'рекомендую'
  });
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    manager_id: '',
    datetime: '',
    format: 'online',
    location_or_link: '',
    comment: ''
  });
  const [managers, setManagers] = useState([]);
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    fetchResumeDetail();
  }, [id]);

  const fetchResumeDetail = async () => {
    try {
      const [resumeResp, reviewsResp] = await Promise.all([
        api.get(`/resumes/${id}/detail`),
        api.get(`/reviews/resume/${id}`)
      ]);
      setResume({ ...resumeResp.data, reviews: reviewsResp.data });
      fetchInterviews();
      if (localStorage.getItem('role') === 'hr') {
        fetchManagers();
      }
    } catch (err) {
      alert('Не удалось загрузить резюме');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const resp = await api.get(`/interviews/?resume_id=${id}`);
      setInterviews(resp.data);
    } catch (err) {
      console.error('Ошибка загрузки собеседований');
    }
  };

  const fetchManagers = async () => {
    try {
      const resp = await api.get('/users?role=manager');
      setManagers(resp.data);
    } catch (err) {
      console.error('Не удалось загрузить руководителей');
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

  const sendInvitation = async () => {
    try {
      await api.post('/notifications/', {
        recipient_id: resume.candidate.id,
        title: inviteTitle,
        message: inviteMessage
      });
      alert('Приглашение отправлено');
      setShowInviteForm(false);
      setInviteMessage('');
    } catch (err) {
      alert('Ошибка отправки');
    }
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews/', {
        resume_id: resume.id,
        ...reviewForm
      });
      alert('Отзыв отправлен');
      setShowReviewForm(false);
      const reviewsResp = await api.get(`/reviews/resume/${id}`);
      setResume({ ...resume, reviews: reviewsResp.data });
    } catch (err) {
      alert('Ошибка при отправке отзыва');
    }
  };

  const createInterview = async () => {
    try {
      await api.post('/interviews/', {
        candidate_id: resume.candidate.id,
        manager_id: parseInt(interviewForm.manager_id),
        resume_id: resume.id,
        datetime: interviewForm.datetime,
        format: interviewForm.format,
        location_or_link: interviewForm.location_or_link,
        comment: interviewForm.comment
      });
      alert('Собеседование создано');
      setShowInterviewForm(false);
      fetchInterviews();
    } catch (err) {
      alert('Ошибка создания собеседования');
    }
  };

  const cancelInterview = async (interviewId) => {
    if (!window.confirm('Отменить собеседование?')) return;
    try {
      await api.post(`/interviews/${interviewId}/cancel`);
      alert('Собеседование отменено');
      fetchInterviews();
    } catch (err) {
      alert('Ошибка отмены');
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
            <a href={`http://localhost:8000/files/download/${doc.id}`} target="_blank" rel="noreferrer">Открыть</a>
            {' | '}
            <a href={`http://localhost:8000/files/download/${doc.id}?download=1`} target="_blank" rel="noreferrer">Скачать</a>
          </li>
        ))}
      </ul>

      {localStorage.getItem('role') === 'hr' && (
        <>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setShowInviteForm(!showInviteForm)}>
              Отправить приглашение
            </button>
            {showInviteForm && (
              <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Заголовок"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  style={{ width: '100%', marginBottom: 5 }}
                />
                <textarea
                  placeholder="Сообщение"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  style={{ width: '100%', marginBottom: 5 }}
                />
                <button onClick={sendInvitation}>Отправить</button>
                <button onClick={() => setShowInviteForm(false)}>Отмена</button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <button onClick={() => { setShowInterviewForm(!showInterviewForm); if (!showInterviewForm) fetchManagers(); }}>
              Назначить собеседование
            </button>
            {showInterviewForm && (
              <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 10 }}>
                <label>Руководитель:</label>
                <select value={interviewForm.manager_id} onChange={(e) => setInterviewForm({...interviewForm, manager_id: e.target.value})}>
                  <option value="">Выберите</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <label>Дата и время:</label>
                <input type="datetime-local" value={interviewForm.datetime} onChange={(e) => setInterviewForm({...interviewForm, datetime: e.target.value})} />
                <label>Формат:</label>
                <select value={interviewForm.format} onChange={(e) => setInterviewForm({...interviewForm, format: e.target.value})}>
                  <option value="online">Онлайн</option>
                  <option value="offline">Офлайн</option>
                  <option value="phone">Телефон</option>
                </select>
                <label>Ссылка/Место:</label>
                <input value={interviewForm.location_or_link} onChange={(e) => setInterviewForm({...interviewForm, location_or_link: e.target.value})} />
                <label>Комментарий:</label>
                <textarea value={interviewForm.comment} onChange={(e) => setInterviewForm({...interviewForm, comment: e.target.value})} />
                <div style={{ marginTop: 10 }}>
                  <button onClick={createInterview}>Создать</button>
                  <button onClick={() => setShowInterviewForm(false)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {localStorage.getItem('role') === 'manager' && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowReviewForm(!showReviewForm)}>
            Оставить отзыв
          </button>
          {showReviewForm && (
            <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 10 }}>
              <label>Общая оценка (1-5):</label>
              <input
                type="number"
                min="1"
                max="5"
                value={reviewForm.overall_score}
                onChange={(e) => setReviewForm({ ...reviewForm, overall_score: parseInt(e.target.value) })}
              />
              <label>Сильные стороны:</label>
              <textarea
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
              />
              <label>Слабые стороны:</label>
              <textarea
                value={reviewForm.weaknesses}
                onChange={(e) => setReviewForm({ ...reviewForm, weaknesses: e.target.value })}
              />
              <label>Комментарий:</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
              <label>Рекомендация:</label>
              <select
                value={reviewForm.recommendation}
                onChange={(e) => setReviewForm({ ...reviewForm, recommendation: e.target.value })}
              >
                <option value="рекомендую">Рекомендую</option>
                <option value="отказ">Отказ</option>
                <option value="резерв">Резерв</option>
              </select>
              <div style={{ marginTop: 10 }}>
                <button onClick={submitReview}>Отправить</button>
                <button onClick={() => setShowReviewForm(false)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      )}

      <h2>Собеседования</h2>
      {interviews.length === 0 && <p>Нет назначенных собеседований</p>}
      {interviews.map(iv => (
        <div key={iv.id} style={{ border: '1px solid #ddd', margin: 5, padding: 10 }}>
          <p><strong>Дата:</strong> {new Date(iv.datetime).toLocaleString()}</p>
          <p><strong>Формат:</strong> {iv.format} {iv.location_or_link && `(${iv.location_or_link})`}</p>
          <p><strong>Статус:</strong> {iv.status}</p>
          {iv.comment && <p><strong>Комментарий:</strong> {iv.comment}</p>}
          {(localStorage.getItem('role') === 'hr' || localStorage.getItem('role') === 'manager') && iv.status === 'scheduled' && (
            <button onClick={() => cancelInterview(iv.id)}>Отменить собеседование</button>
          )}
        </div>
      ))}

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