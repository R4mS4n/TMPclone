import { useState } from 'react';

export default function CodeForm() {
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Code submitted:", code);
    // Add fetch/axios POST to backend here
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Enter Code:
        <br />
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={20}
          cols={80}
        />
      </label>
      <br />
      <button type="submit">Submit</button>
    </form>
  );
}

