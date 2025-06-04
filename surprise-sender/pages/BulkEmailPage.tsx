
import React, { useState, useCallback, useEffect } from 'react';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import FileInput from '../components/common/FileInput';
import { SelectOption, Campaign } from '../types';
import { SparklesIcon, SendIcon, PaperAirplaneIcon } from '../constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { generateTextSuggestion, isAiAvailable } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const predefinedTemplates: SelectOption[] = [ 
  { value: 'newsletter_tpl', label: 'Monthly Newsletter Template' },
  { value: 'promo_tpl', label: 'Promotional Offer Template' },
  { value: 'event_tpl', label: 'Event Invitation Template' },
  { value: 'plain_tpl', label: 'Plain Text Update' },
];

const BulkEmailPage: React.FC = () => {
  const auth = useAuth();
  const [campaignName, setCampaignName] = useState('');
  const [recipientsManual, setRecipientsManual] = useState('');
  const [recipientFile, setRecipientFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [selectedSmtp, setSelectedSmtp] = useState<string>(auth.smtpConfigurations[0]?.id || '');

  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const smtpOptions: SelectOption[] = auth.smtpConfigurations.map(cfg => ({
    value: cfg.id,
    label: cfg.label || `${cfg.host}:${cfg.port} (${cfg.user})`,
  }));

  useEffect(() => {
    const storedCampaigns = localStorage.getItem('surpriseSender_bulkEmailCampaigns');
    if (storedCampaigns) {
      setCampaigns(JSON.parse(storedCampaigns));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('surpriseSender_bulkEmailCampaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  const handleFileSelect = useCallback((file: File | null | string) => {
    if (typeof file === 'string') return; // Should not happen for this component
    setRecipientFile(file as File | null);
    if (file && auth.user) auth.logUserActivity(auth.user.id, `Recipient file selected for bulk email: ${(file as File).name}`);
  }, [auth]);
  
  const handleSuggestSubject = async () => {
    if (!isAiAvailable() || !auth.user) {
      setFormMessage("AI features are disabled. API Key or user session might be missing.");
      return;
    }
    if (!body.trim() && !recipientsManual.trim() && !recipientFile) {
      setFormMessage("Please provide some email body content or recipient info to suggest a subject.");
      return;
    }
    setIsLoadingSubject(true);
    setFormMessage("AI is generating subject suggestions...");
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    const prompt = `As ${auth.user.fullName}, suggest a compelling email subject for a bulk campaign. ${userContext} Email Body (first 100 chars): "${body.substring(0, 100)}...". Provide only the subject line text.`;
    try {
      const suggestion = await generateTextSuggestion(prompt);
      if (!suggestion.startsWith("Error:")) {
        setSubject(suggestion.replace(/^["']|["']$/g, ""));
        setFormMessage("AI subject suggestion applied!");
        auth.logUserActivity(auth.user.id, `AI suggested subject for bulk email: ${suggestion}`);
      } else {
        setFormMessage(suggestion);
      }
    } catch (error: any) {
      setFormMessage(`Failed to get subject suggestion: ${error.message}`);
    }
    setIsLoadingSubject(false);
  };

  const handleEnhanceBody = async () => {
     if (!isAiAvailable() || !auth.user) {
      setFormMessage("AI features are disabled. API Key or user session might be missing.");
      return;
    }
    if (!body.trim()) {
      setFormMessage("Please write some email body content to enhance.");
      return;
    }
    setIsLoadingBody(true);
    setFormMessage("AI is enhancing body content...");
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    const prompt = `As ${auth.user.fullName}, enhance the following bulk email body content to be professional, clear, and engaging for a wide audience. ${userContext} Keep the original intent. Original content: "${body}". Provide only the enhanced text.`;
    try {
      const suggestion = await generateTextSuggestion(prompt);
       if (!suggestion.startsWith("Error:")) {
        setBody(suggestion);
        setFormMessage("AI body enhancement applied!");
        auth.logUserActivity(auth.user.id, `AI enhanced body for bulk email.`);
      } else {
        setFormMessage(suggestion);
      }
    } catch (error: any) {
      setFormMessage(`Failed to enhance body content: ${error.message}`);
    }
    setIsLoadingBody(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setFormMessage(null);

    if (!campaignName || !subject || !body || (!recipientsManual && !recipientFile) || !selectedSmtp) {
        setFormMessage("Error: Please fill all required fields including Campaign Name, Subject, Body, Recipients, and select an SMTP Configuration.");
        setIsSending(false);
        return;
    }

    const campaignDataToLog = { campaignName, recipientsManual: recipientsManual.length, recipientFile: recipientFile?.name, subject, bodyLength: body.length, selectedTemplate, scheduleDateTime, selectedSmtp };
    console.log('Bulk Email Campaign Data:', campaignDataToLog);
    if(auth.user) auth.logUserActivity(auth.user.id, `Submitted Bulk Email campaign: ${campaignName} via SMTP ID ${selectedSmtp}`);
    
    setTimeout(() => {
      setIsSending(false);
      setFormMessage(`Campaign "${campaignName}" queued for sending via SMTP ID ${selectedSmtp}.`);
      
      const newCampaignEntry: Campaign = {
        id: `c${Date.now().toString().slice(-6)}`,
        name: campaignName || 'Untitled Campaign',
        type: 'Email',
        status: scheduleDateTime ? 'Scheduled' : 'Queued',
        recipients: recipientsManual.split(',').filter(r => r.trim()).length + (recipientFile ? 1000 : 0), 
        sentDate: scheduleDateTime || new Date().toISOString(), // Conceptual, actual send is backend
        createdDate: new Date().toISOString(),
      };
      setCampaigns(prev => [newCampaignEntry, ...prev]);
      // Clear form
      setCampaignName(''); 
      setRecipientsManual(''); 
      setRecipientFile(null); 
      setSubject(''); 
      setBody(''); 
      setSelectedTemplate(''); 
      setScheduleDateTime('');
      //setSelectedSmtp(auth.smtpConfigurations[0]?.id || ''); // Keep SMTP or reset as needed
    }, 2000);
  };

  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-2 flex items-center">
        <PaperAirplaneIcon className="w-8 h-8 mr-3 text-accent"/> Bulk Email Campaigns
      </h1>

      {formMessage && (
        <div className={`p-3 rounded-md text-sm mb-6 ${formMessage.toLowerCase().includes("error:") || formMessage.toLowerCase().includes("disabled") || formMessage.toLowerCase().includes("failed") ? 'bg-red-900 text-red-100' : formMessage.toLowerCase().includes("ai is generating") || formMessage.toLowerCase().includes("enhancing") ? 'bg-sky-800 text-sky-100' : 'bg-green-800 text-green-100'}`}>
          {formMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 bg-primary rounded-lg shadow-2xl border border-slate-700 mb-8">
        <Input
          label="Campaign Name"
          id="campaignName"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g., Monthly Newsletter - August"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea
            label="Recipients (Manual Input - Email per line or comma-separated)"
            id="recipientsManual"
            value={recipientsManual}
            onChange={(e) => setRecipientsManual(e.target.value)}
            placeholder="Enter email addresses..."
            rows={3}
          />
          <FileInput
            label="Upload Recipient List (.csv, .txt)"
            id="recipientFile"
            onFileSelect={handleFileSelect}
            currentValue={recipientFile}
            accept=".csv,.txt"
            buttonText="Upload List"
          />
        </div>
        
        <div className="relative">
            <Input
              label="Email Subject"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your compelling email subject"
              required
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
              label="Email Body"
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your bulk email message here..."
              rows={10}
              required
            />
             {isAiAvailable() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceBody}
                isLoading={isLoadingBody}
                disabled={isLoadingBody || !isAiAvailable()}
                className="absolute right-1 bottom-2 text-accent hover:text-sky-300 p-1"
                aria-label="Enhance Body with AI"
                title="Enhance Body with AI"
              >
                {!isLoadingBody && <SparklesIcon className="w-5 h-5" />}
                 {isLoadingBody && <LoadingSpinner size="sm" color="text-accent"/>}
              </Button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Select
            label="Email Template (Optional)"
            id="selectedTemplate"
            options={predefinedTemplates}
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            placeholder="-- Select a template --"
          />
          <Input
            label="Schedule (Optional)"
            id="scheduleDateTime"
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
          />
          <div>
            <Select
              label="SMTP Configuration"
              id="selectedSmtp"
              options={smtpOptions.length > 0 ? smtpOptions : [{value: '', label: 'No SMTP Configurations Saved'}]}
              value={selectedSmtp}
              onChange={(e) => setSelectedSmtp(e.target.value)}
              placeholder="-- Select SMTP --"
              required
              disabled={smtpOptions.length === 0}
            />
            <p className="text-xs text-text-secondary mt-1">Manage SMTPs in Settings.</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="ghost" onClick={() => {setFormMessage("Preview generation is conceptual for now."); if(auth.user) auth.logUserActivity(auth.user.id, `Previewed bulk email campaign: ${campaignName}`);}} disabled={isSending}>
            Preview
          </Button>
          <Button type="submit" variant="primary" leftIcon={<SendIcon />} isLoading={isSending} disabled={isSending || smtpOptions.length === 0}>
            Queue Campaign
          </Button>
        </div>
        {!isAiAvailable() && (
          <p className="text-xs text-amber-400 text-center mt-2">AI features are disabled. Configure API_KEY to enable them.</p>
        )}
        {smtpOptions.length === 0 && (
            <p className="text-xs text-amber-400 text-center mt-2">No SMTP configurations available. Please add them in Settings.</p>
        )}
      </form>

      <div className="mt-10 p-4 sm:p-6 bg-primary rounded-lg shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">Email Campaigns Log</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Recipients (Est.)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-primary divide-y divide-slate-700">
                    {campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{campaign.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    campaign.status === 'Sent' || campaign.status === 'Completed (Client Logged)' ? 'bg-green-700 text-green-100' :
                                    campaign.status === 'Scheduled' ? 'bg-yellow-700 text-yellow-100' :
                                    campaign.status === 'Draft' ? 'bg-gray-600 text-gray-100' :
                                    campaign.status === 'Queued' || campaign.status === 'Sending' ? 'bg-blue-700 text-blue-100' :
                                    'bg-red-700 text-red-100'
                                }`}>
                                    {campaign.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{campaign.recipients.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(campaign.sentDate || campaign.createdDate).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => { if(auth.user) auth.logUserActivity(auth.user.id, `Viewed details for email campaign: ${campaign.name}`); alert(`Viewing details for ${campaign.name} - not fully implemented.`);}} className="mr-2 !p-1.5">View</Button>
                            </td>
                        </tr>
                    ))}
                    {campaigns.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-text-secondary">No email campaigns logged.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailPage;
