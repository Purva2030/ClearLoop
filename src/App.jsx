import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemPrompt = () => {
    return 'You are Clear, an AI thought companion for overthinkers. Be calm, non-judgmental, and structured. Focus on clarity, not motivation. Act like a consultant who slows people down. Use short sentences when appropriate. Never use emojis or exclamation marks. Listen deeply and reflect patterns like uncertainty, catastrophizing, and rumination. Help separate what happened from predictions. Remind users that uncertainty is not evidence. Never force decisions. Be genuine and thoughtful.';
  };

  const callClaude = async (userMessage) => {
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: getSystemPrompt(),
          messages: newHistory
        })
      });

      const data = await response.json();
      const aiText = data.content.find(block => block.type === 'text')?.text || 'I am here. Keep going.';
      
      const updatedHistory = [
        ...newHistory,
        { role: 'assistant', content: aiText }
      ];
      
      setConversationHistory(updatedHistory);
      return aiText;
    } catch (error) {
      console.error('Error calling Claude:', error);
      return 'I am having trouble connecting. But I am still here to listen.';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    const aiResponse = await callClaude(input);
    
    setMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
    setIsProcessing(false);
  };

  const generateReflection = async () => {
    setIsProcessing(true);
    
    const reflectionPrompt = 'Based on everything I have shared so far, give me a reflection. What patterns do you notice? What keeps coming up? Keep it direct and clear.';

    const aiReflection = await callClaude(reflectionPrompt);
    setMessages(prev => [...prev, { type: 'ai', text: aiReflection, isReflection: true }]);
    setIsProcessing(false);
    setScreen('reflect');
  };

  const generateDecisionFramework = async () => {
    setIsProcessing(true);
    
    const decisionPrompt = 'I want help thinking through this decision. Can you help me see best case, worst case, and most likely scenarios? Then remind me that I do not need to decide everything right now.';

    const aiDecision = await callClaude(decisionPrompt);
    setMessages(prev => [...prev, { type: 'ai', text: aiDecision, isDecision: true }]);
    setIsProcessing(false);
    setScreen('decide');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {screen === 'welcome' && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-light text-slate-800 mb-3">ClearLoop</h1>
              <p className="text-slate-500 text-sm">An AI thought companion for overthinkers</p>
            </div>
            
            <div className="mb-10">
              <p className="text-2xl text-slate-700 font-light mb-2">I'm here.</p>
              <p className="text-xl text-slate-600">What's looping in your mind?</p>
            </div>

            <button
              onClick={() => setScreen('unload')}
              className="bg-slate-800 text-white px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
            >
              Talk to Clear
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {screen === 'unload' && (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-light text-slate-800">Unload</h2>
              <p className="text-sm text-slate-500 mt-1">Say what you need to say</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${
                    msg.type === 'user'
                      ? 'ml-8 bg-slate-100 text-slate-800'
                      : 'mr-8 bg-slate-800 text-white'
                  } p-4 rounded-xl`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isProcessing && (
                <div className="mr-8 bg-slate-800 text-white p-4 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100">
              {messages.filter(m => m.type === 'user').length >= 2 && (
                <button
                  onClick={generateReflection}
                  className="w-full mb-3 text-slate-600 text-sm py-2 hover:text-slate-800 transition-colors"
                >
                  I'm ready to reflect
                </button>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your thoughts..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === 'reflect' && (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-light text-slate-800">Reflection</h2>
              <p className="text-sm text-slate-500 mt-1">Here's what I'm noticing</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${
                    msg.type === 'user'
                      ? 'ml-8 bg-slate-100 text-slate-800'
                      : 'mr-8 bg-slate-800 text-white'
                  } p-4 rounded-xl`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isProcessing && (
                <div className="mr-8 bg-slate-800 text-white p-4 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setScreen('unload')}
                  className="flex-1 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Continue unloading
                </button>
                <button
                  onClick={generateDecisionFramework}
                  className="flex-1 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  I want help deciding
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your thoughts..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === 'decide' && (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-light text-slate-800">Decision Mode</h2>
              <p className="text-sm text-slate-500 mt-1">Let's separate what happened from what you're predicting</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${
                    msg.type === 'user'
                      ? 'ml-8 bg-slate-100 text-slate-800'
                      : 'mr-8 bg-slate-800 text-white'
                  } p-4 rounded-xl`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isProcessing && (
                <div className="mr-8 bg-slate-800 text-white p-4 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setScreen('welcome');
                  setMessages([]);
                  setConversationHistory([]);
                }}
                className="w-full mb-3 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 size={18} />
                Done for now
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your thoughts..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;