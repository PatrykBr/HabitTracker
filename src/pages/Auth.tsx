
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (type: 'login' | 'signup') => {
    try {
      setLoading(true);
      const { error } = type === 'login' 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: type === 'login' ? "Welcome back!" : "Welcome!",
          description: type === 'login' 
            ? "You have been successfully logged in."
            : "Your account has been created. You can now log in.",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-secondary to-white">
      <Card className="w-full max-w-sm p-4 sm:p-6 space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-xl sm:text-2xl font-bold">Welcome to Habit Tracker</h1>
          <p className="text-sm text-muted-foreground">Sign in or create an account to continue</p>
        </div>

        <div className="flex justify-center p-1 bg-secondary rounded-lg mb-4">
          <div className="relative w-full grid grid-cols-2">
            <motion.div
              className="absolute h-full bg-primary rounded"
              initial={false}
              animate={{
                x: isLogin ? '0%' : '100%',
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              style={{ width: '50%' }}
            />
            <button
              className={`relative px-2 py-2 text-sm font-medium transition-colors duration-200 ${
                isLogin ? 'text-primary-foreground' : 'text-foreground'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button
              className={`relative px-2 py-2 text-sm font-medium transition-colors duration-200 ${
                !isLogin ? 'text-primary-foreground' : 'text-foreground'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            className="w-full"
            onClick={() => handleAuth(isLogin ? 'login' : 'signup')}
            disabled={loading}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
