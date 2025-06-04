
import React from 'react';

export interface IconProps {
  className?: string;
}

export interface NavItem {
  name:string;
  path: string;
  icon: React.ReactElement<IconProps>; 
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  // For CEO/CFO agent and others, specific dynamic fields might be used here
  [key: string]: any; 
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  buttonText?: string;
  onFileSelect: (file: File | null | string) => void; // Allow string for AI generated placeholder
  currentValue?: File | string | null; // To display current file or AI placeholder
}

export interface Campaign {
  id: string;
  name: string;
  type: 'Email' | 'SMS' | 'HTML Bulk Email';
  status: 'Draft' | 'Scheduled' | 'Queued' | 'Sending' | 'Sent' | 'Failed' | 'Completed (Client Logged)';
  recipients: number;
  sentDate?: string;
  createdDate: string;
  // For tracking page
  opens?: number;
  clicks?: number;
  bounces?: number;
  ctr?: string; // Click-through rate
  openRate?: string;
  generatedByAI?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string; 
  role: 'user' | 'admin';
  registeredAt?: string;
  company?: string; // Optional company name for better AI prompts
}

export interface SmtpConfiguration {
  id: string;
  host: string;
  port: string;
  user: string;
  pass: string;
  clientSideCheck?: 'Valid Format' | 'Invalid Format'; // For frontend basic check
  label?: string; // User-defined label for easy selection
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  registerUser: (userData: Omit<User, 'id' | 'role' | 'registeredAt'>) => User;
  registeredUsers: User[];
  logUserActivity: (userId: string, activity: string) => void;
  getUserActivities: (userId: string) => UserActivity[];
  smtpConfigurations: SmtpConfiguration[];
  saveSmtpConfigurations: (configs: SmtpConfiguration[]) => void;
  emailDrafts: EmailData[];
  saveEmailDraft: (draft: EmailData) => void;
  deleteEmailDraft: (draftSubject: string) => void;
}

export interface UserActivity {
  id: string;
  timestamp: string;
  description: string;
  userId: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string; 
  body: string; 
  isHtml?: boolean;
  dynamicPlaceholders?: string[];
}

export interface AgentSpecificField {
  name: string; 
  label: string;
  type: 'text' | 'textarea' | 'file';
  placeholder?: string;
  fileAccept?: string;
  allowAIGeneration?: boolean; // New flag for AI file generation
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: React.ReactElement<IconProps>;
  templates: EmailTemplate[];
  drafts: EmailData[]; 
  specificFields?: AgentSpecificField[];
}

// SmtpServer type for local settings page processing before saving to context
export interface SmtpServer extends SmtpConfiguration {
    isVerified?: boolean; // Original field from settings page, maps to clientSideCheck
    lastChecked?: string;
}


export interface HtmlBulkEmailData {
  campaignName: string;
  subject: string;
  htmlBody: string;
  recipientsManual: string;
  recipientFile: File | null;
  selectedSmtp: string; 
  generatedByAI?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}
