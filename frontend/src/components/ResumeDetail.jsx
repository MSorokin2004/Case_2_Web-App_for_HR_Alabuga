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
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestComment, setRequestComment] = useState('');

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

  const requestInterview = async () => {
    try {
      await api.post('/interviews/request', {
        resume_id: resume.id,
        comment: requestComment
      });
      alert('Запрос отправлен HR');
      setShowRequestForm(false);
      setRequestComment('');
    } catch (err) {
      alert('Ошибка при отправке запроса');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!resume) return <div className="error">Резюме не найдено</div>;

const handleStatusChange = async (newStatus) => {
  try {
    await api.put(`/resumes/${id}/status?status=${encodeURIComponent(newStatus)}`);
    alert(`Статус изменён на "${newStatus}"`);
    fetchResumeDetail();
  } catch (err) {
    alert('Ошибка изменения статуса');
  }
};

const handleSendOffer = async () => {
  const msg = prompt('Введите текст оффера (необязательно)', 'Вам направлен оффер. Пожалуйста, свяжитесь с HR для обсуждения деталей.');
  if (msg === null) return;
  try {
    await api.post('/notifications/offer', {
      resume_id: id,
      message: msg
    });
    alert('Оффер отправлен');
    fetchResumeDetail();
  } catch (err) {
    alert('Ошибка отправки оффера');
  }
};

  return (
    <div className="resume-detail-container">
      <button onClick={() => navigate('/dashboard')} className="btn-back">← Назад к списку</button>

      <div className="resume-header">
        <h1 className="resume-candidate-name">{resume.candidate.full_name}</h1>
        <div className="resume-actions">
          <button onClick={handleToggleBasket} className={`btn-basket ${resume.in_basket ? 'active' : ''}`}>
            {resume.in_basket ? 'Убрать из корзины' : 'В корзину'}
          </button>
        </div>
      </div>

      <div className="resume-section">
        <h2 className="section-title">Основная информация</h2>
        <div className="info-grid">
          <div className="info-item"><strong>Желаемая должность:</strong> {resume.desired_position}</div>
          <div className="info-item"><strong>Зарплатные ожидания:</strong> {resume.salary_expectation} ₽</div>
          <div className="info-item"><strong>Тип занятости:</strong> {resume.employment_type}</div>
          <div className="info-item"><strong>Формат работы:</strong> {resume.work_format}</div>
          <div className="info-item"><strong>Статус:</strong> {resume.status}</div>
        </div>
        {resume.about && <p className="resume-about"><strong>О себе:</strong> {resume.about}</p>}
      </div>

      <div className="resume-section">
        <h2 className="section-title">Документы</h2>
        <ul className="documents-list">
          {resume.documents.map(doc => (
            <li key={doc.id} className="document-item">
              <span className="doc-filename">{doc.filename}</span>
              <div className="doc-actions">
                <a href={`http://localhost:8000/files/download/${doc.id}`} target="_blank" rel="noreferrer" className="doc-link">Открыть</a>
                <a href={`http://localhost:8000/files/download/${doc.id}?download=1`} className="doc-link">Скачать</a>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Блок для HR: приглашение и назначение собеседования */}
      {localStorage.getItem('role') === 'hr' && (
        <>
          <div className="resume-section">
            <h2 className="section-title">Действия HR</h2>
            <div className="action-buttons">
              <button onClick={() => setShowInviteForm(!showInviteForm)} className="btn-secondary">
                Отправить приглашение
              </button>
              <button onClick={() => { setShowInterviewForm(!showInterviewForm); if (!showInterviewForm) fetchManagers(); }} className="btn-secondary">
                Назначить собеседование
              </button>
            </div>

            {showInviteForm && (
              <div className="form-card">
                <input
                  type="text"
                  placeholder="Заголовок"
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  className="form-input"
                />
                <textarea
                  placeholder="Сообщение"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
                <div className="form-actions">
                  <button onClick={sendInvitation} className="btn-primary">Отправить</button>
                  <button onClick={() => setShowInviteForm(false)} className="btn-outline">Отмена</button>
                </div>
              </div>
            )}

            {showInterviewForm && (
              <div className="form-card">
                <label>Руководитель:</label>
                <select value={interviewForm.manager_id} onChange={(e) => setInterviewForm({...interviewForm, manager_id: e.target.value})} className="form-select">
                  <option value="">Выберите</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
                <label>Дата и время:</label>
                <input type="datetime-local" value={interviewForm.datetime} onChange={(e) => setInterviewForm({...interviewForm, datetime: e.target.value})} className="form-input" />
                <label>Формат:</label>
                <select value={interviewForm.format} onChange={(e) => setInterviewForm({...interviewForm, format: e.target.value})} className="form-select">
                  <option value="online">Онлайн</option>
                  <option value="offline">Офлайн</option>
                  <option value="phone">Телефон</option>
                </select>
                <label>Ссылка/Место:</label>
                <input value={interviewForm.location_or_link} onChange={(e) => setInterviewForm({...interviewForm, location_or_link: e.target.value})} className="form-input" />
                <label>Комментарий:</label>
                <textarea value={interviewForm.comment} onChange={(e) => setInterviewForm({...interviewForm, comment: e.target.value})} className="form-textarea" />
                <div className="form-actions">
                  <button onClick={createInterview} className="btn-primary">Создать</button>
                  <button onClick={() => setShowInterviewForm(false)} className="btn-outline">Отмена</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Блок для руководителя: отзыв и запрос собеседования */}
      {localStorage.getItem('role') === 'manager' && (
        <div className="resume-section">
          <h2 className="section-title">Действия руководителя</h2>
          <div className="action-buttons">
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="btn-secondary">
              Оставить отзыв
            </button>
            <button onClick={() => setShowRequestForm(!showRequestForm)} className="btn-secondary">
              Запросить собеседование
            </button>
            <div className="action-buttons" style={{ marginTop: '16px' }}>
              <button onClick={() => handleStatusChange('Собеседование пройдено')} className="btn-secondary">
                Собеседование пройдено
              </button>
              <button onClick={handleSendOffer} className="btn-secondary">
                Отправить оффер
              </button>
              <button onClick={() => handleStatusChange('Принят')} className="btn-success">
                Принять на работу
              </button>
            </div>
          </div>

          {showReviewForm && (
            <div className="form-card">
              <label>Общая оценка (1-5):</label>
              <input
                type="number"
                min="1"
                max="10"
                value={reviewForm.overall_score}
                onChange={(e) => setReviewForm({ ...reviewForm, overall_score: parseInt(e.target.value) })}
                className="form-input"
              />
              <label>Сильные стороны:</label>
              <textarea value={reviewForm.strengths} onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })} className="form-textarea" />
              <label>Слабые стороны:</label>
              <textarea value={reviewForm.weaknesses} onChange={(e) => setReviewForm({ ...reviewForm, weaknesses: e.target.value })} className="form-textarea" />
              <label>Комментарий:</label>
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} className="form-textarea" />
              <label>Рекомендация:</label>
              <select value={reviewForm.recommendation} onChange={(e) => setReviewForm({ ...reviewForm, recommendation: e.target.value })} className="form-select">
                <option value="рекомендую">Рекомендую</option>
                <option value="отказ">Отказ</option>
                <option value="резерв">Резерв</option>
              </select>
              <div className="form-actions">
                <button onClick={submitReview} className="btn-primary">Отправить</button>
                <button onClick={() => setShowReviewForm(false)} className="btn-outline">Отмена</button>
              </div>
            </div>
          )}

          {showRequestForm && (
            <div className="form-card">
              <label>Комментарий (необязательно):</label>
              <textarea value={requestComment} onChange={(e) => setRequestComment(e.target.value)} rows={3} className="form-textarea" />
              <div className="form-actions">
                <button onClick={requestInterview} className="btn-primary">Отправить запрос</button>
                <button onClick={() => setShowRequestForm(false)} className="btn-outline">Отмена</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="resume-section">
        <h2 className="section-title">Собеседования</h2>
        {interviews.length === 0 ? <p>Нет назначенных собеседований</p> : (
          interviews.map(iv => (
            <div key={iv.id} className="interview-card">
              <p><strong>Дата:</strong> {new Date(iv.datetime).toLocaleString()}</p>
              <p><strong>Формат:</strong> {iv.format} {iv.location_or_link && `(${iv.location_or_link})`}</p>
              <p><strong>Статус:</strong> {iv.status}</p>
              {iv.comment && <p><strong>Комментарий:</strong> {iv.comment}</p>}
              {(localStorage.getItem('role') === 'hr' || localStorage.getItem('role') === 'manager') && iv.status === 'scheduled' && (
                <button onClick={() => cancelInterview(iv.id)} className="btn-danger">Отменить</button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="resume-section">
        <h2 className="section-title">Отзывы</h2>
        {resume.reviews && resume.reviews.length > 0 ? (
          resume.reviews.map(review => (
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
    </div>
  );
};

export default ResumeDetail;