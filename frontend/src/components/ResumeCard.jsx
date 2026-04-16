const ResumeCard = ({ resume }) => {
  return (
    <div style={{ border: '1px solid #ccc', margin: 10, padding: 10, width: 200 }}>
      <h3>{resume.candidate.full_name}</h3>
      <p><strong>{resume.desired_position}</strong></p>
      <p>Salary: {resume.salary_expectation}</p>
      <p>Status: {resume.status}</p>
      <button onClick={() => alert('Schedule interview (to implement)')}>Schedule</button>
    </div>
  );
};

export default ResumeCard;