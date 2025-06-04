
import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_AGENTS, SparklesIcon, SendIcon, HtmlIcon, SaveDraftIcon } from '../constants';
import { Agent, EmailTemplate, EmailData, AgentSpecificField } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import FileInput from '../components/common/FileInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { generateTextSuggestion, isAiAvailable } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentEmail, setCurrentEmail] = useState<EmailData>({ to: '', subject: '', body: '', isHtml: false });
  const [specificFieldValues, setSpecificFieldValues] = useState<Record<string, string | File | null>>({});
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isGeneratingFile, setIsGeneratingFile] = useState<string | null>(null); // Stores field name being generated
  const [isSending, setIsSending] = useState(false);
  const [composerMessage, setComposerMessage] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    if (selectedAgent?.specificFields) {
      const initialSpecificValues: Record<string, string | File | null> = {};
      selectedAgent.specificFields.forEach(field => {
        initialSpecificValues[field.name] = ''; 
      });
      setSpecificFieldValues(initialSpecificValues);
    } else {
      setSpecificFieldValues({});
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent && (currentEmail.body || currentEmail.subject || currentEmail.to || Object.values(specificFieldValues).some(val => !!val))) {
      const handler = setTimeout(() => {
        const draftData = { ...currentEmail, ...specificFieldValues };
        setAgents(prevAgents => prevAgents.map(agent => 
          agent.id === selectedAgent.id 
            ? { ...agent, drafts: [draftData, ...agent.drafts.filter(d => d.subject !== currentEmail.subject || d.body !== currentEmail.body).slice(0,4)] } 
            : agent
        ));
        setComposerMessage(`Content auto-saved as draft for ${selectedAgent.name}.`);
        if (auth.user) auth.logUserActivity(auth.user.id, `Auto-draft saved for agent ${selectedAgent.name}: ${currentEmail.subject}`);
        setTimeout(() => setComposerMessage(null), 3000);
      }, 3500); 

      return () => clearTimeout(handler);
    }
  }, [currentEmail, selectedAgent, auth, specificFieldValues]);

  const handleAgentSelect = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setSelectedAgent(agent || null);
    setCurrentEmail({ to: '', subject: '', body: '', isHtml: false }); 
    setComposerMessage(null);
    if (agent && auth.user) auth.logUserActivity(auth.user.id, `Selected agent: ${agent.name}`);
  };
  
  const handleSpecificFieldChange = (fieldName: string, value: string | File | null) => {
    setSpecificFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleAiGenerateFile = (fieldName: string, fieldLabel: string) => {
    if (!isAiAvailable() || !auth.user) {
        setComposerMessage("AI features disabled or user not logged in.");
        return;
    }
    setIsGeneratingFile(fieldName);
    setComposerMessage(`AI is generating placeholder for ${fieldLabel}...`);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const aiGeneratedFileName = `ai_generated_${fieldName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      setSpecificFieldValues(prev => ({ ...prev, [fieldName]: aiGeneratedFileName }));
      setComposerMessage(`AI generated placeholder "${aiGeneratedFileName}" for ${fieldLabel}.`);
      auth.logUserActivity(auth.user!.id, `AI generated file placeholder for ${fieldLabel} in agent ${selectedAgent?.name}.`);
      setIsGeneratingFile(null);
    }, 2000);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    let finalBody = template.body;
    let finalSubject = template.subject;

    if (template.dynamicPlaceholders) {
        template.dynamicPlaceholders.forEach(placeholder => {
            const fieldName = placeholder.replace(/[{}]/g, ''); 
            // Try matching common variations like 'ceoName' and 'CEOName'
            const fieldValue = specificFieldValues[fieldName] || specificFieldValues[fieldName.charAt(0).toLowerCase() + fieldName.slice(1)] || specificFieldValues[fieldName.toUpperCase()];
            if (fieldValue && typeof fieldValue === 'string') { // Only replace if value is a string
                finalBody = finalBody.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fieldValue);
                finalSubject = finalSubject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fieldValue);
            }
        });
    }
    
    setCurrentEmail({ 
      to: currentEmail.to, 
      subject: finalSubject, 
      body: finalBody, 
      isHtml: template.isHtml || false 
    });
    setComposerMessage(`Template "${template.name}" loaded.`);
    if (auth.user && selectedAgent) auth.logUserActivity(auth.user.id, `Loaded template "${template.name}" for agent ${selectedAgent.name}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEmail(prev => ({ ...prev, [name]: value }));
  };

  const toggleHtmlMode = () => {
    const newIsHtmlState = !currentEmail.isHtml;
    setCurrentEmail(prev => ({ ...prev, isHtml: newIsHtmlState }));
    setComposerMessage(newIsHtmlState ? "HTML mode enabled. Enter raw HTML." : "Rich text mode enabled.");
    if (auth.user && selectedAgent) {
        auth.logUserActivity(auth.user.id, `Toggled HTML mode to ${newIsHtmlState} for agent ${selectedAgent.name}`);
    }
  };

  const handleAiSuggest = async (fieldToUpdate: 'subject' | 'body') => {
    if (!isAiAvailable() || !selectedAgent || !auth.user) {
      setComposerMessage("AI features disabled, no agent selected, or user not logged in.");
      return;
    }
    setIsLoadingAi(true);
    setComposerMessage(null);
    const specificFieldsString = Object.entries(specificFieldValues).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : (value as File)?.name || 'N/A'}`).join(', ');
    const userContext = `User: ${auth.user.fullName}, Company: ${auth.user.company || 'their organization'}.`;
    let prompt = '';
    if (fieldToUpdate === 'subject') {
      prompt = `As ${auth.user.fullName} from ${auth.user.company || 'their organization'}, suggest a compelling email subject for agent "${selectedAgent.name}". Recipient: "${currentEmail.to}". Specific Info: ${specificFieldsString}. Email Body (first 100 chars): "${currentEmail.body.substring(0, 100)}...". ${userContext} Provide only the subject line text.`;
    } else {
      prompt = `As ${auth.user.fullName} from ${auth.user.company || 'their organization'}, enhance this email body for agent "${selectedAgent.name}". Recipient: "${currentEmail.to}". Specific Info: ${specificFieldsString}. Original content: "${currentEmail.body}". ${userContext} Provide only the enhanced text. If current mode is HTML, provide enhanced HTML.`;
    }
    
    try {
      const suggestion = await generateTextSuggestion(prompt);
      if (!suggestion.startsWith("Error:")) {
        setCurrentEmail(prev => ({ ...prev, [fieldToUpdate]: suggestion.replace(/^["']|["']$/g, "") })); // Remove quotes from start/end
        setComposerMessage(`AI ${fieldToUpdate} suggestion applied.`);
        auth.logUserActivity(auth.user.id, `AI suggested ${fieldToUpdate} for agent ${selectedAgent.name}`);
      } else {
        setComposerMessage(suggestion);
      }
    } catch (error: any) {
      setComposerMessage(`Failed to get AI ${fieldToUpdate} suggestion: ${error.message}`);
    }
    setIsLoadingAi(false);
  };

  const handleSaveCurrentDraft = () => {
    if (!selectedAgent) return;
    const draftData = { ...currentEmail, ...specificFieldValues };
    setAgents(prevAgents => prevAgents.map(agent => 
      agent.id === selectedAgent.id 
      ? { ...agent, drafts: [draftData, ...agent.drafts.filter(d => d.subject !== currentEmail.subject || d.body !== currentEmail.body).slice(0,4)] } 
      : agent
    ));
    setComposerMessage(`Draft saved for ${selectedAgent.name}.`);
    if (auth.user) auth.logUserActivity(auth.user.id, `Manually saved draft for agent ${selectedAgent.name}: ${currentEmail.subject}`);
  };

  const handleSend = () => {
    if (!selectedAgent || !auth.user) return;
    setIsSending(true);
    setComposerMessage(null);
    
    const finalEmailData = { ...currentEmail, ...specificFieldValues };
    console.log(`Send request for ${selectedAgent.name}:`, finalEmailData);

    // Auto-template creation logic
    const isNewContent = !selectedAgent.templates.some(t => t.body === currentEmail.body && t.subject === currentEmail.subject);
    if (isNewContent && currentEmail.subject && currentEmail.body) {
      const newTemplate: EmailTemplate = {
        id: `agent-${selectedAgent.id}-tpl-${Date.now()}`,
        name: `Auto: ${currentEmail.subject.substring(0, 20)}... (${new Date().toLocaleTimeString().substring(0,5)})`,
        subject: currentEmail.subject,
        body: currentEmail.body,
        isHtml: currentEmail.isHtml,
        dynamicPlaceholders: selectedAgent.specificFields?.map(f => `{${f.label.replace(/\s+/g, '')}}`)
      };
      setAgents(prevAgents => prevAgents.map(agent =>
        agent.id === selectedAgent.id
          ? { ...agent, templates: [newTemplate, ...agent.templates] }
          : agent
      ));
      auth.logUserActivity(auth.user.id, `Auto-created template "${newTemplate.name}" for agent ${selectedAgent.name}`);
    }
    
    auth.logUserActivity(auth.user.id, `Sent message via agent ${selectedAgent.name} to ${currentEmail.to}: ${currentEmail.subject}`);

    setTimeout(() => {
      setIsSending(false);
      setComposerMessage(`Message to ${currentEmail.to} via ${selectedAgent.name} logged for processing by backend.`);
      setCurrentEmail({ to: '', subject: '', body: '', isHtml: false }); 
    }, 1500);
  };
  
  const renderSpecificField = (field: AgentSpecificField) => {
    const value = specificFieldValues[field.name];
    if (field.type === 'file') {
        return (
            <div key={field.name} className="mb-3">
                <FileInput
                    label={field.label}
                    id={field.name}
                    name={field.name}
                    onFileSelect={(fileOrString) => handleSpecificFieldChange(field.name, fileOrString)}
                    currentValue={value as (File | string | null)}
                    accept={field.fileAccept}
                    buttonText={`Upload ${field.label}`}
                />
                {field.allowAIGeneration && isAiAvailable() && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAiGenerateFile(field.name, field.label)}
                        isLoading={isGeneratingFile === field.name}
                        className="text-accent hover:text-sky-300 mt-1 text-xs !p-1"
                        leftIcon={<SparklesIcon className="w-3 h-3"/>}
                    >
                        {isGeneratingFile === field.name ? 'Generating...' : 'AI Generate File'}
                    </Button>
                )}
            </div>
        );
    }
    switch (field.type) {
      case 'text':
        return <Input key={field.name} label={field.label} name={field.name} value={typeof value === 'string' ? value : ''} onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)} placeholder={field.placeholder} wrapperClassName="mb-2"/>;
      case 'textarea':
        return <Textarea key={field.name} label={field.label} name={field.name} value={typeof value === 'string' ? value : ''} onChange={(e) => handleSpecificFieldChange(field.name, e.target.value)} placeholder={field.placeholder} rows={2} wrapperClassName="mb-2"/>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl min-h-full">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-3 flex items-center">
        <SparklesIcon className="w-8 h-8 mr-3 text-accent"/> AI Powered Agents
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-1 lg:col-span-1 bg-primary p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-text-primary mb-3">Select an Agent</h2>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {agents.map(agent => (
              <li key={agent.id}>
                <Button 
                  variant={selectedAgent?.id === agent.id ? "primary" : "ghost"}
                  className="w-full justify-start text-left !py-2 !px-3"
                  onClick={() => handleAgentSelect(agent.id)}
                  leftIcon={React.cloneElement(agent.icon || <SparklesIcon />, {className: "w-5 h-5"})}
                >
                  <span className="text-sm">{agent.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 lg:col-span-3 bg-primary p-4 rounded-lg shadow-lg">
          {!selectedAgent ? (
            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <SparklesIcon className="w-16 h-16 text-accent mx-auto mb-4" />
              <p className="text-text-secondary">Select an agent to view its capabilities and compose messages.</p>
            </div>
          ) : (
            <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-accent mb-1">{selectedAgent.name}</h2>
                <p className="text-sm text-text-secondary mb-4">{selectedAgent.description}</p>
              </div>

              {selectedAgent.specificFields && selectedAgent.specificFields.length > 0 && (
                <div className="p-3 border border-slate-700 rounded-md bg-slate-800/50 space-y-3">
                  <h3 className="text-md font-semibold text-text-secondary">Agent Specific Information:</h3>
                  {selectedAgent.specificFields.map(renderSpecificField)}
                </div>
              )}

              <div className="bg-slate-800/50 p-3 rounded-md">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Agent Templates</h3>
                {selectedAgent.templates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.templates.map(template => (
                      <Button key={template.id} variant="secondary" size="sm" onClick={() => handleTemplateSelect(template)}>
                        {template.name}
                      </Button>
                    ))}
                  </div>
                ) : <p className="text-xs text-text-secondary italic">No predefined templates for this agent.</p>}
                
                {selectedAgent.drafts.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">Recent Drafts:</h4>
                        {selectedAgent.drafts.slice(0,3).map((draft, idx) => (
                             <Button key={idx} variant="ghost" size="sm" onClick={() => {setCurrentEmail(draft); setSpecificFieldValues(draft);}} className="text-xs mr-1 mb-1">
                                {(draft.subject || "Untitled Draft").substring(0,25)}...
                             </Button>
                        ))}
                    </div>
                )}
              </div>
              
              <div className="space-y-4 border-t border-slate-700 pt-4">
                {composerMessage && <p className={`text-sm p-2 rounded-md ${composerMessage.toLowerCase().includes("error:") || composerMessage.toLowerCase().includes("disabled") || composerMessage.toLowerCase().includes("failed") ? 'bg-red-900/70 text-red-100' : composerMessage.toLowerCase().includes("draft") || composerMessage.toLowerCase().includes("auto-saved") ? 'bg-yellow-800/70 text-yellow-100' : composerMessage.toLowerCase().includes("generating") ? 'bg-sky-700/70 text-sky-100': 'bg-sky-900/70 text-sky-100'}`}>{composerMessage}</p>}
                <Input label="To:" name="to" value={currentEmail.to} onChange={handleChange} placeholder="recipient@example.com" />
                <div className="relative">
                  <Input label="Subject:" name="subject" value={currentEmail.subject} onChange={handleChange} placeholder="Email Subject" />
                  {isAiAvailable() && <Button type="button" variant="ghost" size="sm" onClick={() => handleAiSuggest('subject')} isLoading={isLoadingAi} className="absolute right-1 bottom-1 text-accent p-1" aria-label="Suggest subject with AI" title="Suggest subject with AI"><SparklesIcon className="w-4 h-4"/></Button>}
                </div>
                <div className="relative">
                  <Textarea label={`Body (${currentEmail.isHtml ? "HTML Mode" : "Text Mode"}):`} name="body" value={currentEmail.body} onChange={handleChange} rows={8} placeholder="Compose message..."/>
                  <div className="absolute right-1 top-0 mt-1 flex space-x-1">
                    {isAiAvailable() && !currentEmail.isHtml && <Button type="button" variant="ghost" size="sm" onClick={() => handleAiSuggest('body')} isLoading={isLoadingAi} className="text-accent p-1" aria-label="Enhance body with AI" title="Enhance body with AI"><SparklesIcon className="w-4 h-4"/></Button>}
                    <Button type="button" variant="ghost" size="sm" onClick={toggleHtmlMode} title={currentEmail.isHtml ? "Switch to Text Mode" : "Switch to HTML Mode"} className="text-accent p-1"><HtmlIcon className="w-4 h-4"/></Button>
                  </div>
                </div>
                {currentEmail.isHtml && (
                    <div className="p-2 border border-slate-600 rounded bg-slate-800 max-h-32 overflow-y-auto">
                        <h4 className="text-xs text-text-secondary mb-1">HTML Preview:</h4>
                        <div className="text-xs prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{__html: currentEmail.body}}></div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-600 mt-2">
                   <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSaveCurrentDraft}
                        disabled={!selectedAgent || isSending}
                        leftIcon={<SaveDraftIcon/>}
                    >
                        Save Current Draft
                    </Button>
                  <Button variant="primary" onClick={handleSend} isLoading={isSending} leftIcon={<SendIcon />} disabled={!selectedAgent || !currentEmail.to}>Send via Agent</Button>
                </div>
                 {!isAiAvailable() && (
                    <p className="text-xs text-amber-400 text-center mt-1">AI features are disabled. Configure API_KEY to enable them.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
