import { useState, useEffect } from 'react';
import api from '../api';

const CandidateProfile = () => {
  const [resume, setResume] = useState(null);
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

  const fetchResume = async () => {
    try {
      const resp = await api.get('/resumes/me');
      setResume(resp.data);
      setForm({
        desired_position: resp.data.desired_position,
        salary_expectation: resp.data.salary_expectation,
        employment_type: resp.data.employment_type,
        work_format: resp.data.work_format,
        about: resp.data.about
      });
    } catch (err) {
      // resume not found, ignore
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (resume) {
        await api.put('/resumes/me', form);
      } else {
        await api.post('/resumes', form);
      }
      fetchResume();
    } catch (error) {
      alert('Error saving resume');
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
    } catch (error) {
      alert('Upload failed');
    }
  };

  return (
    <div>
      <h2>My Resume</h2>
      <form onSubmit={handleSubmit}>
        <input name="desired_position" placeholder="Desired Position" value={form.desired_position} onChange={handleChange} required />
        <input name="salary_expectation" type="number" placeholder="Salary Expectation" value={form.salary_expectation} onChange={handleChange} />
        <input name="employment_type" placeholder="Employment Type" value={form.employment_type} onChange={handleChange} />
        <input name="work_format" placeholder="Work Format" value={form.work_format} onChange={handleChange} />
        <textarea name="about" placeholder="About" value={form.about} onChange={handleChange} />
        <button type="submit">Save Resume</button>
      </form>

      {resume && (
        <div>
          <h3>Upload Document</h3>
          <form onSubmit={handleFileUpload}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit">Upload</button>
          </form>
          <h3>Documents</h3>
          <ul>
            {resume.documents.map(doc => (
              <li key={doc.id}>
                {doc.filename} <a href={`http://localhost:8000/files/download/${doc.id}`} target="_blank">Download</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;