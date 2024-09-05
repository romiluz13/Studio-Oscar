import React from 'react';

const LangsamGPT: React.FC = () => {
  return (
    <div className="langsam-gpt-container p-4">
      <h1 className="text-3xl font-bold mb-4">Langsam GPT</h1>
      <p className="mb-4">Welcome to Langsam GPT. This bot is knowledgeable about Hadassah and Oscar Langsam. Feel free to ask anything about them!</p>
      <iframe
        title="Langsam GPT Bot"
        style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
        src="https://app.fastbots.ai/embed/cm0iir2mi053wr4bjr03z0nki"
      ></iframe>
    </div>
  );
};

export default LangsamGPT;