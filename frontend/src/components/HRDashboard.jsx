import { useEffect, useState } from 'react';
import api from '../api';
import ResumeCard from './ResumeCard';

const HRDashboard = () => {
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    api.get('/resumes/').then(resp => setResumes(resp.data));
  }, []);

  return (
    <div>
      <h2>Candidate Resumes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {resumes.map(r => <ResumeCard key={r.id} resume={r} />)}
      </div>
    </div>
  );
};

export default HRDashboard;