import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-xrp-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-xrp-navy/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-xrp-blue to-xrp-navy flex items-center justify-center shadow-glow">
            <img 
              src="https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=025" 
              alt="XRP" 
              className="w-7 h-7"
            />
          </div>
          <div>
            <h1 className="font-rajdhani font-bold text-2xl text-white">XRP Nexus</h1>
            <span className="text-xs text-xrp-blue uppercase tracking-widest">Terminal</span>
          </div>
        </Link>

        {/* Form Card */}
        <div className="glass-card p-8 border border-dark-border">
          <h2 className="font-rajdhani text-3xl font-bold text-white text-center mb-2">
            Create Account
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Join XRP Nexus and start trading
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="register-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  data-testid="register-confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-dark-bg border-dark-border focus:border-xrp-blue h-12 pl-11"
                />
              </div>
            </div>

            <Button
              data-testid="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-xrp-blue hover:bg-xrp-blue-dark text-white font-rajdhani font-semibold text-lg shadow-glow"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-xrp-blue hover:text-xrp-blue-light font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
