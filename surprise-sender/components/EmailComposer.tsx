
import React, { useState, useCallback, useEffect } from 'react';
import Input from './common/Input';
import Textarea from './common/Textarea';
import Button from './common/Button';
import { EmailData } from '../types';
import { generateTextSuggestion, isAiAvailable } from '../services/geminiService';
import { SparklesIcon, SendIcon, HtmlIcon, SaveDraftIcon } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const EmailComposer: React.FC = () => {
  const auth = useAuth();
  const [emailData, setEmailData] = useState<EmailData>({
    to: '',
    subject: '',
    body: '',
    isHtml: false,
  });
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  

  // Auto-Drafting
  useEffect(() => {
    if (emailData.body || emailData.subject || emailData.to) {
      const handler = setTimeout(() => {
        if(auth.user) { // Ensure user is available before saving draft
            auth.saveEmailDraft(emailData);
            setComposerMessage("Draft auto-saved!");
            // User activity logged within saveEmailDraft
            setTimeout(() => setComposerMessage(null), 2000);
        }
      }, 3500); 

      return () => clearTimeout(handler);
    }
  }, [emailData, auth]);


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  }, []);

  const toggleHtmlMode = () => {
    const newIsHtml = !emailData.isHtml;
    setEmailData(prev => ({ ...prev, isHtml: newIsHtml }));
    setComposerMessage(newIsHtml ? "Switched to HTML mode. Enter raw HTML." : "Switched to Rich Text mode.");
     if (auth.user) auth.logUserActivity(auth.user.id, `Toggled HTML mode to ${newIsHtml} in main composer.`);
  };

  const handleSuggestSubject = async () => {
    if (!isAiAvailable() || !auth.user) {
      setComposerMessage("AI features are disabled. API Key or user session might be missing.");
      return;
    }
    if (!emailData.body.trim() && !emailData.to.trim()) {
      setComposerMessage("Please provide recipient or some email body content to suggest a subject.");
      return;
    }
    setIsLoadingSubject(true);
    setComposerMessage("AI is generating subject...");
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    const prompt = `As ${auth.user.fullName}, suggest a compelling email subject line. ${userContext} Email context: To: "${emailData.to}", Body (first 100 chars): "${emailData.body.substring(0, 100)}...". Provide only the subject line text.`;
    try {
      const suggestion = await generateTextSuggestion(prompt);
      if (!suggestion.startsWith("Error:")) {
        setEmailData(prev => ({ ...prev, subject: suggestion.replace(/^["']|["']$/g, "") }));
        setComposerMessage("AI subject suggestion applied!");
        auth.logUserActivity(auth.user.id, `AI suggested subject in main composer.`);
      } else {
        setComposerMessage(suggestion);
      }
    } catch (error: any) {
      setComposerMessage(`Failed to get subject suggestion: ${error.message}`);
    }
    setIsLoadingSubject(false);
  };

  const handleEnhanceBody = async () => {
     if (!isAiAvailable() || !auth.user) {
      setComposerMessage("AI features are disabled. API Key or user session might be missing.");
      return;
    }
    if (!emailData.body.trim()) {
      setComposerMessage("Please write some email body content to enhance.");
      return;
    }
    setIsLoadingBody(true);
    setComposerMessage("AI is enhancing body content...");
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    const prompt = `As ${auth.user.fullName}, enhance the following email body content to be more professional, clear, and engaging. ${userContext} Keep the original intent. Original content: "${emailData.body}". Provide only the enhanced text. If current mode is HTML, provide enhanced HTML.`;
    try {
      const suggestion = await generateTextSuggestion(prompt);
       if (!suggestion.startsWith("Error:")) {
        setEmailData(prev => ({ ...prev, body: suggestion }));
        setComposerMessage("AI body enhancement applied!");
        auth.logUserActivity(auth.user.id, `AI enhanced body in main composer.`);
      } else {
        setComposerMessage(suggestion);
      }
    } catch (error: any) {
      setComposerMessage(`Failed to enhance body content: ${error.message}`);
    }
    setIsLoadingBody(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setComposerMessage(`Logging send request for email to ${emailData.to}...`);
    console.log('Email Data queued for sending:', emailData); // Changed wording from "to be sent"
    if (auth.user) auth.logUserActivity(auth.user.id, `Initiated send email from main composer to ${emailData.to}: ${emailData.subject}`);
    
    setTimeout(() => {
      setIsSending(false);
      setComposerMessage(`Email to ${emailData.to} has been queued for processing by the backend.`);
      setEmailData({ to: '', subject: '', body: '', isHtml: false }); // Clear form
      // Conceptually, this email would be added to a "sent items" or "outbox" queue,
      // which is a backend responsibility. Client-side, we could add to a local "sent items" log.
    }, 2000);
  };
  
  const handleSaveCurrentDraft = () => {
    if(!auth.user) {
        setComposerMessage("Cannot save draft. User not logged in.");
        return;
    }
    auth.saveEmailDraft(emailData);
    setComposerMessage("Draft saved successfully!");
    // User activity logged within saveEmailDraft in AuthContext
    setTimeout(() => setComposerMessage(null), 2000);
  };

  const loadDraft = (draft: EmailData) => {
    setEmailData(draft);
    setComposerMessage(`Draft "${draft.subject || 'Untitled'}" loaded.`);
    if (auth.user) auth.logUserActivity(auth.user.id, `Loaded draft: ${draft.subject || 'Untitled'}`);
  };

  const deleteDraft = (draftSubject: string) => {
    auth.deleteEmailDraft(draftSubject); // Assumes subject is unique enough for this demo
    setComposerMessage(`Draft "${draftSubject}" deleted.`);
    // User activity logged within deleteEmailDraft in AuthContext
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 bg-primary rounded-lg shadow-2xl border border-slate-700">
      {composerMessage && (
        <div className={`p-3 rounded-md text-sm ${composerMessage.toLowerCase().includes("error:") || composerMessage.toLowerCase().includes("disabled") || composerMessage.toLowerCase().includes("failed") || composerMessage.toLowerCase().includes("cannot save") ? 'bg-red-900 text-red-100' : composerMessage.toLowerCase().includes("draft") || composerMessage.toLowerCase().includes("auto-saved") || composerMessage.toLowerCase().includes("loaded") || composerMessage.toLowerCase().includes("deleted") ? 'bg-yellow-800 text-yellow-100' : composerMessage.toLowerCase().includes("ai is generating") || composerMessage.toLowerCase().includes("enhancing") ? 'bg-sky-800 text-sky-100' :'bg-green-800 text-green-100'}`}>
          {composerMessage}
        </div>
      )}
      <Input
        label="To"
        id="to"
        name="to"
        type="email"
        value={emailData.to}
        onChange={handleChange}
        placeholder="recipient@example.com"
        required
        wrapperClassName="relative"
      />
      
      <div className="relative">
        <Input
          label="Subject"
          id="subject"
          name="subject"
          type="text"
          value={emailData.subject}
          onChange={handleChange}
          placeholder="Your email subject"
          required
          wrapperClassName="flex-grow"
        />
        {isAiAvailable() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSuggestSubject}
            isLoading={isLoadingSubject}
            disabled={isLoadingSubject || !isAiAvailable()}
            className="absolute right-1 bottom-1 text-accent hover:text-sky-300 p-1"
            aria-label="Suggest Subject with AI"
            title="Suggest Subject with AI"
          >
            {!isLoadingSubject && <SparklesIcon className="w-5 h-5" />}
            {isLoadingSubject && <LoadingSpinner size="sm" color="text-accent"/>}
          </Button>
        )}
      </div>

      <div className="relative">
        <Textarea
          label={`Body (${emailData.isHtml ? "HTML Mode" : "Text Mode"})`}
          id="body"
          name="body"
          value={emailData.body}
          onChange={handleChange}
          placeholder={emailData.isHtml ? "Enter raw HTML code here..." : "Write your message here..."}
          rows={10}
          required
          wrapperClassName="flex-grow"
        />
        <div className="absolute right-1 top-0 mt-1 flex space-x-1">
            {isAiAvailable() && !emailData.isHtml && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceBody}
                isLoading={isLoadingBody}
                disabled={isLoadingBody || !isAiAvailable()}
                className="text-accent hover:text-sky-300 p-1"
                aria-label="Enhance Body with AI"
                title="Enhance Body with AI"
              >
                {!isLoadingBody && <SparklesIcon className="w-5 h-5" />}
                {isLoadingBody && <LoadingSpinner size="sm" color="text-accent"/>}
              </Button>
            )}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleHtmlMode}
                className="text-accent hover:text-sky-300 p-1"
                aria-label={emailData.isHtml ? "Switch to Text Mode" : "Switch to HTML Mode"}
                title={emailData.isHtml ? "Switch to Text Mode" : "Switch to HTML Mode"}
              >
                <HtmlIcon className="w-5 h-5"/>
            </Button>
        </div>
      </div>

      {emailData.isHtml && (
        <div className="p-2 border border-slate-600 rounded bg-slate-800 max-h-40 overflow-y-auto">
            <h4 className="text-xs text-text-secondary mb-1">HTML Preview:</h4>
            <div className="text-xs prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{__html: emailData.body}}></div>
        </div>
      )}


      <div className="flex justify-between items-center pt-4 border-t border-slate-700">
        <div>
            <Button type="button" variant="ghost" onClick={handleSaveCurrentDraft} disabled={isSending} leftIcon={<SaveDraftIcon/>}>
              Save Draft
            </Button>
        </div>
        <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={() => {setEmailData({to: '', subject: '', body: '', isHtml: false}); if(auth.user) auth.logUserActivity(auth.user.id, `Cleared main composer.`);}} disabled={isSending}>
              Clear
            </Button>
            <Button type="submit" variant="primary" leftIcon={<SendIcon />} isLoading={isSending} disabled={isSending || !emailData.to}>
              Queue Email
            </Button>
        </div>
      </div>
       {!isAiAvailable() && (
        <p className="text-xs text-amber-400 text-center mt-2">AI features are disabled. Configure API_KEY to enable them.</p>
      )}
    </form>

    {auth.emailDrafts.length > 0 && (
        <div className="mt-8 p-4 bg-primary rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Saved Drafts</h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
                {auth.emailDrafts.map((draft, index) => (
                    <li key={`${draft.subject}-${index}`} className="flex justify-between items-center p-2 bg-slate-700 rounded hover:bg-slate-600">
                        <span className="text-sm text-text-secondary truncate cursor-pointer hover:text-accent" onClick={() => loadDraft(draft)}>
                           To: {draft.to || 'N/A'} - Subject: {draft.subject || 'Untitled Draft'}
                        </span>
                        <div>
                            <Button size="sm" variant="ghost" onClick={() => loadDraft(draft)} className="mr-1 !p-1 text-sky-400">Load</Button>
                            <Button size="sm" variant="danger" onClick={() => deleteDraft(draft.subject)} className="!p-1">Delete</Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )}
    </>
  );
};

export default EmailComposer;
