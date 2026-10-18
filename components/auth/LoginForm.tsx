import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';

const LoginForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('user@dupoin.com');
  const [password, setPassword] = useState('password123');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; api?: string }>({});
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!identifier) newErrors.identifier = 'Email or Phone Number is required.';
    if (!password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await login(identifier, password); 
    if (success) {
      navigate('/'); // Navigate to dashboard on successful login
    } else {
      setErrors(prev => ({ ...prev, api: error || 'Login failed. Please try again.' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <img 
          src="/logo-dupoin.png" 
          alt="Dupoin Logo" 
          className="block mx-auto max-w-full h-[132px] -mt-[33px] object-contain transition-transform hover:scale-105 duration-300 drop-shadow-[0_0_20px_rgba(34,180,195,0.35)]"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('.png.png')) {
              target.src = '/logo-dupoin.png.png';
            }
          }}
        />
        <p className="text-primary -mt-[12px] text-xs tracking-widest font-bold uppercase">
          ONE STOP TRADING PLATFORM
        </p>
      </div>

      {errors.api && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
          {errors.api}
        </div>
      )}

      <div className="space-y-4">
        <Input
          id="identifier"
          label="Email Address"
          type="text"
          placeholder="Enter your email"
          icon={identifier.includes('@') || identifier === '' ? <EnvelopeIcon /> : <PhoneIcon />}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setErrors(prev => ({ ...prev, identifier: undefined, api: undefined }));
          }}
          error={errors.identifier}
          className="bg-slate-800/60 border-gray-700 focus:border-primary"
        />
        
        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={<LockClosedIcon />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors(prev => ({ ...prev, password: undefined, api: undefined }));
            }}
            error={errors.password}
            className="bg-slate-800/60 border-gray-700 focus:border-primary"
          />
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-primary hover:text-cyan-300 text-sm font-medium">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3.5 px-4 bg-primary hover:bg-[#1BA1AF] text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-cyan-500/25 active:scale-[0.99] ${
          isLoading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-700/60" />
        <span className="px-3 text-gray-400 text-xs uppercase tracking-wider">or</span>
        <hr className="flex-grow border-gray-700/60" />
      </div>

      <p className="text-center text-gray-400 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:text-cyan-300 font-semibold ml-1">
          Register Now
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;