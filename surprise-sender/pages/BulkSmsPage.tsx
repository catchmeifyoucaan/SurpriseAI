
import React, { useState, useCallback, useEffect } from 'react';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import FileInput from '../components/common/FileInput';
import { SelectOption, Campaign } from '../types';
import { SparklesIcon, SendIcon, BulkSmsIcon as PageIcon } from '../constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { generateTextSuggestion, isAiAvailable } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const predefinedSmsTemplates: SelectOption[] = [ 
  { value: 'otp_tpl', label: 'OTP Verification Template' },
  { value: 'reminder_tpl', label: 'Appointment Reminder Template' },
  { value: 'flash_sale_tpl', label: 'Flash Sale Alert Template' },
];

const predefinedSmsGateways: SelectOption[] = [ 
  { value: 'gateway_ng_a', label: 'Nigerian Gateway Alpha' },
  { value: 'gateway_ng_b', label: 'Nigerian Gateway Beta' },
  { value: 'gateway_global_c', label: 'Global Gateway Gamma' },
];


const MAX_SMS_CHARS_SINGLE = 160;
const MAX_SMS_CHARS_CONCAT = 153; // Max chars for subsequent parts of a concatenated SMS

const BulkSmsPage: React.FC = () => {
  const auth = useAuth();
  const [campaignName, setCampaignName] = useState('');
  const [recipientsManual, setRecipientsManual] = useState('');
  const [recipientFile, setRecipientFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [senderId, setSenderId] = useState('');

  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  
  const [charCount, setCharCount] = useState(0);
  const [smsParts, setSmsParts] = useState(1);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const count = message.length;
    setCharCount(count);
    if (count === 0) {
      setSmsParts(0);
    } else if (count <= MAX_SMS_CHARS_SINGLE) {
      setSmsParts(1);
    } else {
      // For multi-part SMS, each part uses fewer characters due to headers
      setSmsParts(Math.ceil(count / MAX_SMS_CHARS_CONCAT));
    }
  }, [message]);

  useEffect(() => {
    const storedCampaigns = localStorage.getItem('surpriseSender_bulkSmsCampaigns');
    if (storedCampaigns) {
      setCampaigns(JSON.parse(storedCampaigns));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('surpriseSender_bulkSmsCampaigns', JSON.stringify(campaigns));
  }, [campaigns]);


  const handleFileSelect = useCallback((file: File | null | string) => {
    if (typeof file === 'string') return; // Should not happen
    setRecipientFile(file as File | null);
    if (file && auth.user) auth.logUserActivity(auth.user.id, `Recipient file selected for bulk SMS: ${(file as File).name}`);
  }, [auth]);

  const handleSuggestMessage = async () => {
    if (!isAiAvailable() || !auth.user) {
      setFormMessage("AI features are disabled. API Key or user session might be missing.");
      return;
    }
    if (!campaignName && !recipientsManual && !recipientFile) {
      setFormMessage("Please provide campaign name or recipient info to suggest an SMS message.");
      return;
    }
    setIsLoadingMessage(true);
    setFormMessage("AI is generating SMS message...");
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    const prompt = `As ${auth.user.fullName}, suggest a concise and effective SMS message for a bulk campaign named "${campaignName}". ${userContext} Keep it under 160 characters. Provide only the SMS text.`;
    try {
      const suggestion = await generateTextSuggestion(prompt);
      if (!suggestion.startsWith("Error:")) {
        setMessage(suggestion.substring(0, MAX_SMS_CHARS_SINGLE * 3)); // Allow a bit more for editing
        setFormMessage("AI SMS suggestion applied!");
        auth.logUserActivity(auth.user.id, `AI suggested SMS message for campaign: ${campaignName}`);
      } else {
        setFormMessage(suggestion);
      }
    } catch (error: any) {
      setFormMessage(`Failed to get SMS message suggestion: ${error.message}`);
    }
    setIsLoadingMessage(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setFormMessage(null);

    if (!campaignName || !message || (!recipientsManual && !recipientFile) || !selectedGateway || !senderId) {
        setFormMessage("Error: Please fill all required fields: Campaign Name, Message, Recipients, Sender ID, and select an SMS Gateway.");
        setIsSending(false);
        return;
    }
    if (senderId.length > 11 && !/^\d+$/.test(senderId)) { // Alphanumeric max 11
        setFormMessage("Error: Alphanumeric Sender ID cannot be more than 11 characters.");
        setIsSending(false);
        return;
    }
     if (senderId.length > 15 && /^\d+$/.test(senderId)) { // Numeric max 15
        setFormMessage("Error: Numeric Sender ID cannot be more than 15 digits.");
        setIsSending(false);
        return;
    }


    const smsCampaignDataToLog = { campaignName, recipientsManual: recipientsManual.length, recipientFile: recipientFile?.name, message, senderId, selectedTemplate, scheduleDateTime, selectedGateway };
    console.log('Bulk SMS Campaign Data:', smsCampaignDataToLog);
    if(auth.user) auth.logUserActivity(auth.user.id, `Submitted Bulk SMS campaign: ${campaignName} via Gateway ${selectedGateway}`);
    
    setTimeout(() => {
      setIsSending(false);
      setFormMessage(`SMS Campaign "${campaignName}" queued for sending via ${selectedGateway}.`);
      
      const newCampaignEntry: Campaign = {
        id: `s${Date.now().toString().slice(-6)}`,
        name: campaignName || 'Untitled SMS Campaign',
        type: 'SMS',
        status: scheduleDateTime ? 'Scheduled' : 'Queued',
        recipients: recipientsManual.split(/[,\n]/).filter(r => r.trim()).length + (recipientFile ? 500 : 0), 
        sentDate: scheduleDateTime || new Date().toISOString(),
        createdDate: new Date().toISOString(),
      };
      setCampaigns(prev => [newCampaignEntry, ...prev]);
      // Clear form
      setCampaignName(''); 
      setRecipientsManual(''); 
      setRecipientFile(null); 
      setMessage(''); 
      setSelectedTemplate(''); 
      setScheduleDateTime(''); 
      setSenderId('');
      // setSelectedGateway(''); // Or reset to default
    }, 2000);
  };

  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-2 flex items-center">
        <PageIcon className="w-8 h-8 mr-3 text-accent"/> Bulk SMS Campaigns
      </h1>
      
      {formMessage && (
        <div className={`p-3 rounded-md text-sm mb-6 ${formMessage.toLowerCase().includes("error:") || formMessage.toLowerCase().includes("disabled") || formMessage.toLowerCase().includes("failed") ? 'bg-red-900 text-red-100' : formMessage.toLowerCase().includes("ai is generating") ? 'bg-sky-800 text-sky-100' : 'bg-green-800 text-green-100'}`}>
          {formMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 bg-primary rounded-lg shadow-2xl border border-slate-700 mb-8">
        <Input
          label="Campaign Name"
          id="campaignNameSms"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="e.g., Weekend Flash Sale SMS"
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea
            label="Recipients (Phone numbers, comma-separated or one per line)"
            id="recipientsManualSms"
            value={recipientsManual}
            onChange={(e) => setRecipientsManual(e.target.value)}
            placeholder="Enter phone numbers..."
            rows={3}
          />
          <FileInput
            label="Upload Recipient List (.csv, .txt)"
            id="recipientFileSms"
            onFileSelect={handleFileSelect}
            currentValue={recipientFile}
            accept=".csv,.txt"
            buttonText="Upload List"
          />
        </div>
        
        <div className="relative">
            <Textarea
              label="SMS Message"
              id="messageSms"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message here..."
              rows={5}
              required
            />
            <div className="text-xs text-text-secondary mt-1 text-right">
              {charCount} characters / {smsParts} SMS part(s)
            </div>
             {isAiAvailable() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSuggestMessage}
                isLoading={isLoadingMessage}
                disabled={isLoadingMessage || !isAiAvailable()}
                className="absolute top-0 right-1 text-accent hover:text-sky-300 p-1"
                style={{transform: 'translateY(2.25rem)'}} 
                aria-label="Suggest SMS Message with AI"
                title="Suggest SMS Message"
              >
                {!isLoadingMessage && <SparklesIcon className="w-5 h-5" />}
                 {isLoadingMessage && <LoadingSpinner size="sm" color="text-accent"/>}
              </Button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Select
            label="SMS Template (Optional)"
            id="selectedTemplateSms"
            options={predefinedSmsTemplates}
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            placeholder="-- Select an SMS template --"
          />
          <Input
            label="Sender ID (Alphanumeric max 11 / Numeric max 15)"
            id="senderId"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            placeholder="e.g., MyCompany or +1234567890"
            maxLength={15} 
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Schedule (Optional)"
            id="scheduleDateTimeSms"
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
          />
          <Select
            label="SMS Gateway (Nigerian Focus)"
            id="selectedGatewaySms"
            options={predefinedSmsGateways}
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value)}
            placeholder="-- Select SMS Gateway --"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="ghost" onClick={() => setFormMessage(`Previewing SMS for campaign "${campaignName || 'Untitled'}". Message: ${message}`)} disabled={isSending}>
            Preview SMS
          </Button>
          <Button type="submit" variant="primary" leftIcon={<SendIcon />} isLoading={isSending} disabled={isSending}>
            Queue Campaign
          </Button>
        </div>
         {!isAiAvailable() && (
          <p className="text-xs text-amber-400 text-center mt-2">AI message suggestions are disabled. Configure API_KEY to enable them.</p>
        )}
      </form>
      
      <div className="mt-10 p-4 sm:p-6 bg-primary rounded-lg shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">SMS Campaigns Log</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Recipients (Est.)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date Logged</th>
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
                                <Button variant="ghost" size="sm" onClick={() => { if(auth.user) auth.logUserActivity(auth.user.id, `Viewed details for SMS campaign: ${campaign.name}`); alert(`Viewing details for ${campaign.name} - not fully implemented.`);}} className="mr-2 !p-1.5">View Details</Button>
                            </td>
                        </tr>
                    ))}
                     {campaigns.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-text-secondary">No SMS campaigns logged.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default BulkSmsPage;
