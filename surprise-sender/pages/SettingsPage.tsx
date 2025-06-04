
import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import { SmtpConfiguration } from '../types'; 
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const auth = useAuth();
  const [smtpListInput, setSmtpListInput] = useState('');
  // processedSmtpList is removed as configurations are directly read from auth.smtpConfigurations
  const [isProcessingSmtp, setIsProcessingSmtp] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const [profileFullName, setProfileFullName] = useState(auth.user?.fullName || '');
  const [profileCompany, setProfileCompany] = useState(auth.user?.company || '');


  useEffect(() => {
    setProfileFullName(auth.user?.fullName || '');
    setProfileCompany(auth.user?.company || '');
  }, [auth.user]);

  const handleSmtpListSave = () => {
    if (!smtpListInput.trim()) {
      setProcessingMessage('SMTP list input is empty. Nothing to save.');
      return;
    }
    setIsProcessingSmtp(true);
    setProcessingMessage('Processing and saving SMTP configurations...');
    
    const lines = smtpListInput.split('\n').filter(line => line.trim() !== '');
    const newConfigurations: SmtpConfiguration[] = lines.map((line, index) => {
      const parts = line.split(':'); 
      const host = parts[0]?.trim() || '';
      const port = parts[1]?.trim() || '';
      const user = parts[2]?.trim() || '';
      const pass = parts[3]?.trim() || '';
      const label = parts[4]?.trim() || `${host} (${user || 'default'})`;
      const isValidFormat = !!host && !!port && !!user && !!pass; // Stricter check for saving
      return {
        id: `smtp-cfg-${Date.now()}-${index}`,
        host,
        port,
        user,
        pass, 
        label,
        clientSideCheck: isValidFormat ? 'Valid Format' : 'Invalid Format',
      };
    });

    // Simulate processing delay
    setTimeout(() => {
      // Append new configurations to existing ones in AuthContext
      auth.saveSmtpConfigurations([...auth.smtpConfigurations, ...newConfigurations.filter(c => c.clientSideCheck === 'Valid Format')]);
      
      setIsProcessingSmtp(false);
      const validCount = newConfigurations.filter(s => s.clientSideCheck === 'Valid Format').length;
      const invalidCount = newConfigurations.length - validCount;
      let message = `Processed ${lines.length} SMTP entries. ${validCount} configurations with valid format saved.`;
      if (invalidCount > 0) {
        message += ` ${invalidCount} entries had an invalid format (host:port:user:pass required) and were not saved.`;
      }
      setProcessingMessage(message);

      if (auth.user) auth.logUserActivity(auth.user.id, `Attempted to save ${newConfigurations.length} new SMTP configurations. ${validCount} saved.`);
      setSmtpListInput(''); // Clear input after attempting to save
    }, 1500);
  };
  
  const handleSaveSettings = (section: string) => {
      let details = '';
      if (auth.user) {
        if (section === 'Profile') {
            const updatedUser = { ...auth.user, fullName: profileFullName, company: profileCompany };
            auth.login(updatedUser); // This re-saves to localStorage and updates context
            details = `Full Name: ${profileFullName}, Company: ${profileCompany}`;
            setProcessingMessage('Profile settings updated and saved locally.');
        } else {
            // For other sections like SMS, Telegram - data is just logged for now
            details = `${section} settings form submitted.`;
            setProcessingMessage(`${section} settings submitted (data logged, no actual save action).`);
        }
        auth.logUserActivity(auth.user.id, `${section} settings updated. ${details}`);
      } else {
        setProcessingMessage('Error: User not authenticated.');
      }
      setTimeout(() => setProcessingMessage(''), 3000);
  };

  return (
    <div className="bg-secondary p-6 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-2">Settings</h1>
      
      {processingMessage && <p className={`text-sm p-3 rounded-md mb-4 ${processingMessage.includes('Error') ? 'bg-red-900/70 text-red-100' : 'bg-sky-800/70 text-sky-100'}`}>{processingMessage}</p>}

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-accent mb-3">Profile</h2>
          <div className="bg-primary p-6 rounded-md shadow-lg space-y-4">
            <Input 
              label="Full Name" 
              id="fullName" 
              value={profileFullName} 
              onChange={(e) => setProfileFullName(e.target.value)}
            />
            <Input 
              label="Company Name" 
              id="companyName" 
              value={profileCompany} 
              onChange={(e) => setProfileCompany(e.target.value)}
              placeholder="Your Company LLC"
            />
            <Input label="Email Address" id="email" type="email" value={auth.user?.email || ""} readOnly className="cursor-not-allowed bg-slate-800"/>
            <Button variant="primary" onClick={() => handleSaveSettings('Profile')}>Update Profile</Button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-accent mb-3">SMTP Configurations</h2>
          <div className="bg-primary p-6 rounded-md shadow-lg space-y-4">
            <Textarea
              label="Add New SMTP Servers (host:port:user:pass:[label] per line)"
              id="smtpListInput"
              value={smtpListInput}
              onChange={(e) => setSmtpListInput(e.target.value)}
              placeholder={"smtp.example.com:587:user1:pass1:Primary Server\nsmtp.another.com:465:user2:pass2"}
              rows={6}
            />
            <Button variant="primary" onClick={handleSmtpListSave} isLoading={isProcessingSmtp}>
              {isProcessingSmtp ? 'Processing...' : 'Save New SMTP Configurations'}
            </Button>
            
            {auth.smtpConfigurations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold text-text-primary mb-2">Current Saved SMTP Configurations:</h3>
                <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {auth.smtpConfigurations.map(server => (
                    <li key={server.id} className={`p-2 rounded text-xs ${server.clientSideCheck === 'Valid Format' ? 'bg-green-800/70' : 'bg-yellow-800/70'}`}>
                      <strong>Label:</strong> {server.label || 'N/A'} ({server.host}:{server.port}, User: {server.user})
                      <span className="ml-2 font-bold">({server.clientSideCheck || 'Format Not Checked'})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             <p className="text-xs text-text-secondary mt-3">These configurations will be available for selection in campaign sending pages. SMTPs are only saved if they follow the basic `host:port:user:pass` format.</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-accent mb-3">SMS Gateway (Nigerian Focus)</h2>
          <div className="bg-primary p-6 rounded-md shadow-lg space-y-4">
            <Input label="Gateway API Key" id="smsApiKey" placeholder="Enter API Key for SMS Gateway" />
            <Input label="Sender ID" id="smsSenderId" placeholder="Your Approved Sender ID" />
            <Button variant="primary" onClick={() => handleSaveSettings('SMS Gateway')}>Save SMS Settings (Logs Action)</Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-accent mb-3">Telegram Bot</h2>
          <div className="bg-primary p-6 rounded-md shadow-lg space-y-4">
            <Input label="Bot Token" id="telegramToken" placeholder="Enter Your Telegram Bot Token"/>
            <Input label="Chat ID (for notifications)" id="telegramChatId" placeholder="Your User/Group Chat ID"/>
            <Button variant="primary" onClick={() => handleSaveSettings('Telegram Bot')}>Save Telegram Settings (Logs Action)</Button>
          </div>
        </section>
        <p className="text-xs text-text-secondary text-center pt-4">Note: Gemini AI API Key is managed via environment variables and not set here.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
