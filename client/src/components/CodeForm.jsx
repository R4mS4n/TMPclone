import { useState } from 'react';

export default function CodeForm({ questionId, languageId }) {
  const [code, setCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/questions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          code,
          languageId,
        }),
      });

      const data = await response.json();
      console.log('[RESPONSE]', data);
      alert('Code submitted!');
    } catch (err) {
      console.error('[ERROR] Failed to submit code:', err);
      alert('Error submitting code');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        rows="15"
        cols="80"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
        style={{ fontFamily: 'monospace', whiteSpace: 'pre', tabSize: 2 }}
      />
      <br />
      <button type="submit">Submit Code</button>
    </form>
  );
}

