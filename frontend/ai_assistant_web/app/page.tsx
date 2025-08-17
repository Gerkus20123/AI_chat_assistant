"use client";

import { useState, useRef, useEffect, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- DEFINICJE TYPÓW ---
/**
 * Definiuje strukturę obiektu wiadomości w czacie.
 */
interface Message {
  text: string;
  sender: 'user' | 'ai';
  error?: boolean;
  loading?: boolean; // Dodane pole do oznaczania wiadomości w trakcie ładowania
}

// --- STAŁE I ZMIENNE ---
// WAŻNE: Zastąp pusty klucz swoim kluczem API
const apiKey = "AIzaSyBa1WvA_xt4Rtk-4YcXEWGFpici6K-_2uc";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Automatyczne przewijanie okna czatu po dodaniu nowej wiadomości
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Implementacja wykładniczego powrotu (exponential backoff)
  const withExponentialBackoff = async <T,>(apiCall: () => Promise<T>, retries = 5, delay = 1000): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return withExponentialBackoff(apiCall, retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  };

  // Funkcja do wysyłania zapytania do API Gemini
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { text: prompt, sender: 'user' }]);
    setInput('');

    // Dodanie placeholder z flagą loading: true
    const loadingMessage: Message = { text: '...', sender: 'ai', loading: true };
    setMessages(prev => [...prev, loadingMessage]);

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const apiCall = async () => {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`Błąd API: ${response.status}`);
      }
      return await response.json();
    };

    try {
      const result = await withExponentialBackoff(apiCall);
      
      let aiResponseText = 'Nie udało się uzyskać poprawnej odpowiedzi od AI.';
      let isError = true;

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        aiResponseText = result.candidates[0].content.parts[0].text;
        isError = false;
      }
      
      // Zaktualizuj stan, aby zastąpić placeholder finalną wiadomością
      setMessages(prev =>
        prev.map(msg => (msg === loadingMessage ?
          { text: aiResponseText, sender: 'ai', error: isError, loading: false } :
          msg
        ))
      );
    } catch (error: any) {
      // Zaktualizuj stan, aby zastąpić placeholder wiadomością o błędzie
      setMessages(prev =>
        prev.map(msg => (msg === loadingMessage ?
          { text: `Wystąpił błąd: ${error.message}. Spróbuj ponownie.`, sender: 'ai', error: true, loading: false } :
          msg
        ))
      );
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl flex flex-col h-[90vh] font-inter">
      {/* Niestandardowy CSS dla animacji */}
      <style>{`
        .typing-animation span {
          animation: blink 1s infinite;
          display: inline-block;
          margin: 0 1px;
        }

        .typing-animation span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-animation span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Mój Asystent AI</h1>

      {/* Okno czatu */}
      <div ref={chatWindowRef} className="flex-grow border border-gray-200 rounded-xl p-4 space-y-4 mb-4 bg-gray-50 overflow-y-auto scroll-smooth">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white self-end ml-auto rounded-br-none' : 'bg-gray-200 text-gray-800 self-start mr-auto rounded-bl-none'} ${msg.error ? 'bg-red-500' : ''}`}
          >
            {msg.loading ? (
              <div className="flex items-center space-x-1 typing-animation text-gray-500">
                <span className="text-xl leading-none">.</span>
                <span className="text-xl leading-none">.</span>
                <span className="text-xl leading-none">.</span>
              </div>
            ) : (
              <ReactMarkdown
                children={msg.text}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={darcula}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Formularz wprowadzania tekstu */}
      <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={isLoading ? 'Ładowanie...' : 'Zadaj pytanie...'}
          className="flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden text-black placeholder-gray-500"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            const textarea = e.target;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 shadow-md disabled:bg-indigo-400"
          disabled={isLoading}
        >
          Wyślij
        </button>
      </form>
    </div>
  );
}