import React, { useState } from 'react';
import { Eye, EyeOff, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

interface LoginProps {
  onLogin: (credentials: { email: string; password: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors(prev => ({ ...prev, email: t('validation.required') }));
      return;
    }
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: t('validation.required') }));
      return;
    }

    setLoading(true);
    
    // Simulate API call - accept any credentials for demo
    setTimeout(() => {
      onLogin({ email, password });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('common.welcome_back')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.sign_in_to_account')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label={t('common.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            placeholder={t('common.email')}
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label={t('common.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            placeholder={t('common.password')}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-input text-primary focus:ring-ring"
              />
              <span className="ml-2 text-sm text-muted-foreground">{t('common.remember_me')}</span>
            </label>
            <a href="#" className="text-sm text-primary hover:text-primary-hover">
              {t('common.forgot_password')}
            </a>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            {t('common.sign_in')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('common.demo_credentials')}
          </p>
        </div>
      </Card>
    </div>
  );
};