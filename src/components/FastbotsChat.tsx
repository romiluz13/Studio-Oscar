import React, { useEffect } from 'react';

const FastbotsChat: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.fastbots.ai/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.FastbotsWidget.init({
        botId: 'YOUR_BOT_ID_HERE'
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default FastbotsChat;