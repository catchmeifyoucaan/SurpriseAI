
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import { generateTextSuggestion, isAiAvailable } from '../services/geminiService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PaperAirplaneIcon, SparklesIcon, SupportIcon as PageIcon } from '../constants'; // Reusing PaperAirplaneIcon for send

const SupportPage: React.FC = () => {
  const auth = useAuth();
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (auth.user) {
      auth.logUserActivity(auth.user.id, 'Viewed Support Page.');
    }
    // Initial AI message
    setChatMessages([
      {
        id: 'ai-init-' + Date.now(),
        text: "Hello! I'm the Surprise Sender AI Support Assistant. How can I help you today with general questions about our platform?",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
    ]);
  }, [auth]);

  useEffect(() => {
    // Scroll to bottom of chat display when new messages are added
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !auth.user) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userInput,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    auth.logUserActivity(auth.user.id, `AI Support: Asked - "${userInput.substring(0, 50)}..."`);
    
    const currentInput = userInput;
    setUserInput('');
    setIsLoadingAiResponse(true);
    setChatError(null);

    if (!isAiAvailable()) {
      const aiErrorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "I'm sorry, but the AI features are currently unavailable. Please check the API key configuration or try again later.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiErrorMessage]);
      setIsLoadingAiResponse(false);
      return;
    }

    const prompt = `You are a friendly and helpful AI Support Assistant for 'Surprise Sender', a web application for AI-assisted communication (email, SMS, agents). The user's question is: "${currentInput}". Provide a concise and helpful answer regarding general platform features or usage. If you don't know the answer, it's too complex, if it asks for personal opinions, or if it requires specific account access or debugging of user-specific data, politely state that you cannot assist with that specific query and suggest they contact human support via the provided email addresses (riseurp@gmail.com or admin@surprisesender.com). Keep your responses relatively short and focused. Do not provide instructions on how to become an admin. Do not discuss API keys or backend configurations.`;

    try {
      const aiResponseText = await generateTextSuggestion(prompt);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: aiResponseText.startsWith("Error:") ? "I encountered an issue trying to process your request. Please try rephrasing or contact human support." : aiResponseText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Support Error:", error);
      const aiErrorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        text: "I'm sorry, I couldn't process your request at this moment. Please try again or contact human support.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiErrorMessage]);
      setChatError("An error occurred while getting an AI response.");
    }
    setIsLoadingAiResponse(false);
  };

  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl min-h-full">
      <h1 className="text-3xl font-bold text-text-primary mb-8 border-b-2 border-accent pb-3 flex items-center">
        <PageIcon className="w-8 h-8 mr-3 text-accent"/> Support Center
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Us Section */}
        <div className="lg:col-span-1 bg-primary p-6 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-2xl font-semibold text-accent mb-4">Contact Us Directly</h2>
          <div className="space-y-3 text-text-secondary">
            <p>
              For general inquiries or support, please email us at:
              <a href="mailto:riseurp@gmail.com" className="block text-sky-400 hover:text-accent transition-colors">riseurp@gmail.com</a>
            </p>
            <p>
              For administrative or platform-specific issues, contact:
              <a href="mailto:admin@surprisesender.com" className="block text-sky-400 hover:text-accent transition-colors">admin@surprisesender.com</a>
            </p>
            <p>
              For business inquiries and partnerships, please use the email addresses above. We aim to respond within 2 business days.
            </p>
            <p>
              Follow us on Twitter:
              <a href="https://twitter.com/riseurp" target="_blank" rel="noopener noreferrer" className="block text-sky-400 hover:text-accent transition-colors">@riseurp</a>
            </p>
          </div>
        </div>

        {/* AI Support Assistant Section */}
        <div className="lg:col-span-2 bg-primary p-6 rounded-lg shadow-lg border border-slate-700 flex flex-col">
          <h2 className="text-2xl font-semibold text-accent mb-4 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2"/> AI Support Assistant
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Ask our AI assistant for help with general questions about Surprise Sender. For specific account issues, please use the contact methods.
          </p>

          <div 
            ref={chatDisplayRef} 
            className="flex-grow bg-slate-800/50 p-4 rounded-md mb-4 overflow-y-auto h-96 max-h-[60vh] border border-slate-700 space-y-4"
          >
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-accent text-primary' : 'bg-slate-700 text-text-primary'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary/70 text-right' : 'text-text-secondary/70'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoadingAiResponse && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-3 rounded-lg bg-slate-700 text-text-primary">
                  <LoadingSpinner size="sm" color="text-accent" message="AI is thinking..." />
                </div>
              </div>
            )}
          </div>
          
          {chatError && <p className="text-sm text-red-400 mb-2">{chatError}</p>}

          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <Input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about Surprise Sender..."
              className="flex-grow !py-2.5" // Ensure consistent height
              disabled={isLoadingAiResponse}
              aria-label="Your support question"
            />
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={isLoadingAiResponse} 
              disabled={!userInput.trim() || isLoadingAiResponse}
              className="!px-4 !py-2.5" // Ensure consistent height
              aria-label="Send message to AI support"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
          </form>
           {!isAiAvailable() && (
             <p className="text-xs text-amber-400 text-center mt-3">AI Support features are currently disabled. Check API key configuration.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
