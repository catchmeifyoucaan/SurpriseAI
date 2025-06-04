
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { UserIcon as RegisterUserIcon } from '../constants'; 
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState(''); // Optional company
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const auth = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }
    
    if (auth.registeredUsers.find(u => u.email === email)) {
        setError('This email is already registered. Please try logging in or use a different email.');
        setIsLoading(false);
        auth.logUserActivity('guest', `Registration attempt with existing email: ${email}.`);
        return;
    }

    setTimeout(() => {
      try {
        const newUser = auth.registerUser({ fullName, email, company }); 
        
        setSuccessMessage(`Registration successful for ${email}! Your role is: ${newUser.role}. Logging you in...`);
        // User activity for registration and login is handled within AuthContext functions.
        
        auth.login(newUser); // Automatically log in the newly registered user
        
        setTimeout(() => {
          navigate('/'); 
        }, 1500); 

      } catch (regError: any) {
        setError(regError.message || 'Registration failed. Please try again.');
        auth.logUserActivity('guest', `Registration failed for email: ${email}. Error: ${regError.message}`);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AuthLayout title="Create Your Account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
        {successMessage && <p className="text-sm text-green-400 bg-green-900/50 p-3 rounded-md text-center">{successMessage}</p>}
        <Input
          label="Full Name"
          id="fullName"
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          autoComplete="name"
          disabled={isLoading}
        />
        <div>
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
          {/* Admin registration hint explicitly removed from UI */}
        </div>
        <Input
          label="Company Name (Optional)"
          id="company"
          name="company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your Company Inc."
          autoComplete="organization"
          disabled={isLoading}
        />
        <Input
          label="Password (min. 6 characters)"
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        <Input
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        <div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} leftIcon={<RegisterUserIcon className="w-5 h-5"/>}>
            Sign Up
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:text-sky-400">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
