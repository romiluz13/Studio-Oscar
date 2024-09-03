import React, { useState, useEffect } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import * as pdfjs from 'pdfjs-dist';

const LangsamGPT: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookContent, setBookContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookLoading, setBookLoading] = useState(true);
  const [bookChunks, setBookChunks] = useState<string[]>([]);

  useEffect(() => {
    const fetchAndProcessBook = async () => {
      setBookLoading(true);
      const storage = getStorage();
      const bookRef = ref(storage, 'langsambook.pdf');
      try {
        const url = await getDownloadURL(bookRef);
        const pdfDoc = await pdfjs.getDocument(url).promise;
        let content = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const text = await page.getTextContent();
          content += text.items.map((item: any) => item.str).join(' ');
        }
        setBookContent(content);
        console.log('Book content loaded, length:', content.length);
        const chunks = splitIntoChunks(content, 1000); // Split into 1000-character chunks
        setBookChunks(chunks);
      } catch (error) {
        console.error('Error fetching book:', error);
        setErrorMessage('Failed to fetch the book content. Please try again later.');
      }
      setBookLoading(false);
    };
    fetchAndProcessBook();
  }, []);

  const splitIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const findRelevantChunks = (query: string, chunks: string[], numChunks: number = 3): string[] => {
    // This is a very basic relevance function. In practice, you'd use more sophisticated methods.
    return chunks
      .map(chunk => ({ chunk, relevance: chunk.split(query).length - 1 }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, numChunks)
      .map(item => item.chunk);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const relevantChunks = findRelevantChunks(input, bookChunks);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4-0613",
          messages: [
            { 
              role: 'system', 
              content: `You are an AI assistant trained on a book about Holocaust survivors, focusing on Oscar and Hadassah. Use the following relevant excerpts to answer the user's question: ${relevantChunks.join('\n\n')}`
            },
            { role: 'user', content: input }
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );
      setResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(`API Error: ${error.response?.data?.error?.message || error.message}`);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="langsam-gpt p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Langsam GPT</h2>
      {bookLoading ? (
        <p>Loading book content...</p>
      ) : (
        <>
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="mb-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Ask a question about Oscar and Hadassah..."
            />
            <button
              type="submit"
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading || bookLoading}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </form>
          {response && (
            <div className="bg-gray-100 p-4 rounded mb-4">
              <h3 className="font-bold mb-2">Response:</h3>
              <p>{response}</p>
            </div>
          )}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Chat with our AI Assistant</h3>
            <iframe
              src="https://app.fastbots.ai/embed/cm0iir2mi053wr4bjr03z0nki"
              style={{ width: '100%', height: '600px', border: 'none', borderRadius: '8px' }}
              title="AI Assistant Chatbot"
            ></iframe>
          </div>
        </>
      )}
    </div>
  );
};

export default LangsamGPT;