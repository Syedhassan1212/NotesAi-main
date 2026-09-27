import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || '/api'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      login(data.token, data.username);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border-hairline">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">NotesAi</h1>
          <p className="text-text-secondary mt-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-text-primary"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary text-sm hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
