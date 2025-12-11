import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HardHat, Hammer, Ruler, ArrowRight, LayoutTemplate } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/'); else setError('Invalid credentials.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup({ name, email, phone, password });
    if (success) navigate('/'); else setError('Email exists or invalid data.');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Brand/Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <div className="absolute top-10 left-10"><Ruler size={120} /></div>
           <div className="absolute bottom-20 right-20"><HardHat size={160} /></div>
           <div className="absolute top-1/2 left-1/3"><LayoutTemplate size={80} /></div>
        </div>
        
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-2 rounded-lg"><Hammer size={24} /></div>
              <span className="text-2xl font-bold tracking-wider">UNIQID</span>
           </div>
           <h1 className="text-4xl font-bold leading-tight mb-4">Building the Future,<br/>Designing Dreams.</h1>
           <p className="text-slate-400 text-lg max-w-md">Access the internal portal to manage projects, materials, and schedules securely.</p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} UNIQID Construction & Interior Design.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Join Team'}</h2>
             <p className="text-sm text-gray-500 mt-2">{isLogin ? 'Enter your credentials to access the intranet' : 'Create your staff account'}</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
             <button onClick={()=>{setIsLogin(true);setError('')}} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Login</button>
             <button onClick={()=>{setIsLogin(false);setError('')}} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Register</button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>{error}</div>}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
                 <>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label><input required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Phone</label><input required type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
                 </>
            )}
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input required type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Password</label><input required type="password" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={password} onChange={e=>setPassword(e.target.value)} /></div>
            
            <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center group">
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {isLogin && <div className="mt-8 text-center text-xs text-gray-400">Default: admin@uniqid.com / admin123</div>}
        </div>
      </div>
    </div>
  );
};
