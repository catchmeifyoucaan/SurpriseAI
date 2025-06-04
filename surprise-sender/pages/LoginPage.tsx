
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LoginIcon } from '../constants';
import { useAuth } from '../context/AuthContext'; 
import { User } from '../types'; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call for login
    setTimeout(() => {
      // Check against registered users. The role is determined by AuthContext.
      const registeredUser = auth.registeredUsers.find(u => u.email === email);

      if (registeredUser && password === 'password') { // Any registered user can log in with 'password' for this app's context
        auth.login(registeredUser);
        // Activity is logged within auth.login
        navigate('/');
      }
      else {
        setError('Invalid email or password. Please try again.');
        auth.logUserActivity('guest', `Failed login attempt for email: ${email}.`);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AuthLayout title="Welcome Back!">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
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
        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••• (Hint: use 'password')"
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
           <div className="text-right mt-1">
            <Link to="/forgot-password" className="text-xs font-medium text-accent hover:text-sky-400">
              Forgot Password?
            </Link>
          </div>
        </div>
        <div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} leftIcon={<LoginIcon/>}>
            Sign In
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-accent hover:text-sky-400">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
