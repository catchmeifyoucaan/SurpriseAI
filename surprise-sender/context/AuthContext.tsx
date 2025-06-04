
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserActivity, SmtpConfiguration, EmailData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isAdminEmail = (email: string): boolean => {
  return /^admin-\d+@surprisesender\.com$/.test(email) || email === 'user@example.com';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<Record<string, UserActivity[]>>({});
  const [smtpConfigurations, setSmtpConfigurations] = useState<SmtpConfiguration[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<EmailData[]>([]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('surpriseSenderUser');
      const storedRegisteredUsers = localStorage.getItem('surpriseSender_registeredUsers');
      const storedActivities = localStorage.getItem('surpriseSender_userActivities');
      const storedSmtpConfigs = localStorage.getItem('surpriseSender_smtpConfigs');
      const storedEmailDrafts = localStorage.getItem('surpriseSender_emailDrafts');


      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        parsedUser.role = isAdminEmail(parsedUser.email) ? 'admin' : 'user';
        setUser(parsedUser);
        setIsAuthenticated(true);
        // logUserActivity(parsedUser.id, 'User session loaded from storage.'); // Avoid logging on every initial load
      }

      if (storedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(storedRegisteredUsers));
      } else {
         // Initialize with a default admin if no users are stored (for first run)
        const defaultAdmin: User = {
          id: 'admin-0',
          fullName: 'Default Admin',
          email: 'admin-0@surprisesender.com',
          company: 'Surprise Sender HQ',
          role: 'admin',
          registeredAt: new Date().toISOString(),
        };
        setRegisteredUsers([defaultAdmin]);
        // If default admin is set, log them in for easy first-time use
        if (!storedUser) {
          login(defaultAdmin); 
        }
      }
      
      if (storedActivities) {
        setUserActivities(JSON.parse(storedActivities));
      }
      if (storedSmtpConfigs) {
        setSmtpConfigurations(JSON.parse(storedSmtpConfigs));
      }
       if (storedEmailDrafts) {
        setEmailDrafts(JSON.parse(storedEmailDrafts));
      }

    } catch (error) {
      console.error("Error initializing AuthContext from localStorage:", error);
      localStorage.removeItem('surpriseSenderUser');
      localStorage.removeItem('surpriseSender_registeredUsers');
      localStorage.removeItem('surpriseSender_userActivities');
      localStorage.removeItem('surpriseSender_smtpConfigs');
      localStorage.removeItem('surpriseSender_emailDrafts');
    }
    setIsLoading(false);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Persist registeredUsers
  useEffect(() => {
    if (!isLoading) { // Only save after initial load to prevent overwriting with empty array
        localStorage.setItem('surpriseSender_registeredUsers', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers, isLoading]);

  // Persist userActivities
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('surpriseSender_userActivities', JSON.stringify(userActivities));
    }
  }, [userActivities, isLoading]);

  // Persist smtpConfigurations
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('surpriseSender_smtpConfigs', JSON.stringify(smtpConfigurations));
    }
  }, [smtpConfigurations, isLoading]);

  // Persist emailDrafts
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('surpriseSender_emailDrafts', JSON.stringify(emailDrafts));
    }
  }, [emailDrafts, isLoading]);

  const login = (userData: User) => {
    const userWithRoleAndCompany: User = {
      ...userData,
      role: isAdminEmail(userData.email) ? 'admin' : 'user',
      company: userData.company || (isAdminEmail(userData.email) ? 'Admin Corp' : 'User Company'), // Example default
    };
    setUser(userWithRoleAndCompany);
    setIsAuthenticated(true);
    localStorage.setItem('surpriseSenderUser', JSON.stringify(userWithRoleAndCompany));
    logUserActivity(userWithRoleAndCompany.id, `User logged in: ${userWithRoleAndCompany.email}`);
    
    // Ensure user exists in registeredUsers list
    setRegisteredUsers(prev => {
        if (!prev.find(u => u.email === userWithRoleAndCompany.email)) {
            const newUserForList: User = {
                ...userWithRoleAndCompany,
                registeredAt: userWithRoleAndCompany.registeredAt || new Date().toISOString(),
            };
            return [...prev, newUserForList];
        }
        return prev;
    });
  };

  const logout = () => {
    if (user) {
      logUserActivity(user.id, `User logged out: ${user.email}`);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('surpriseSenderUser');
  };

  const registerUser = (userData: Omit<User, 'id' | 'role' | 'registeredAt'>): User => {
    const newUserId = `user-${Date.now()}`;
    const newUserRole = isAdminEmail(userData.email) ? 'admin' : 'user';
    const newUser: User = {
      ...userData,
      id: newUserId,
      role: newUserRole,
      company: userData.company || (newUserRole === 'admin' ? 'Admin Corp' : 'User Company'),
      registeredAt: new Date().toISOString(),
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    logUserActivity(newUser.id, `New user registered: ${newUser.email} with role ${newUser.role}`);
    return newUser;
  };
  
  const logUserActivity = (userId: string, description: string) => {
    const newActivity: UserActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      description,
      userId,
    };
    setUserActivities(prev => {
      const userSpecificActivities = prev[userId] ? [...prev[userId], newActivity] : [newActivity];
      const MAX_ACTIVITIES_PER_USER = 50;
      if (userSpecificActivities.length > MAX_ACTIVITIES_PER_USER) {
        userSpecificActivities.splice(0, userSpecificActivities.length - MAX_ACTIVITIES_PER_USER);
      }
      return { ...prev, [userId]: userSpecificActivities };
    });
  };

  const getUserActivities = (userId: string): UserActivity[] => {
    return userActivities[userId] || [];
  };

  const saveSmtpConfigurations = (configs: SmtpConfiguration[]) => {
    setSmtpConfigurations(configs); // This directly sets, not appends. Settings page logic handles appending.
    if(user) logUserActivity(user.id, `Updated SMTP configurations. Total: ${configs.length}.`);
  };

  const saveEmailDraft = (draft: EmailData) => {
    setEmailDrafts(prevDrafts => {
        const existingIndex = prevDrafts.findIndex(d => d.subject === draft.subject && d.to === draft.to); 
        if (existingIndex > -1) {
            const updatedDrafts = [...prevDrafts];
            updatedDrafts[existingIndex] = draft;
            if(user) logUserActivity(user.id, `Updated email draft: ${draft.subject}`);
            return updatedDrafts;
        }
        if(user) logUserActivity(user.id, `Saved new email draft: ${draft.subject}`);
        return [draft, ...prevDrafts].slice(0, 20); // Keep last 20 drafts
    });
  };

  const deleteEmailDraft = (draftSubject: string) => { 
    setEmailDrafts(prevDrafts => prevDrafts.filter(d => d.subject !== draftSubject));
    if(user) logUserActivity(user.id, `Deleted email draft: ${draftSubject}`);
  };


  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout, 
        isLoading, 
        registerUser, 
        registeredUsers, 
        logUserActivity, 
        getUserActivities,
        smtpConfigurations,
        saveSmtpConfigurations,
        emailDrafts,
        saveEmailDraft,
        deleteEmailDraft
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
