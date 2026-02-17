import React, { useState } from 'react';
import { Eye, EyeOff, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useReduxSelector } from '../../redux/hooks';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { status, error, fieldErrors } = useReduxSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Bu alan zorunludur' }));
      return;
    }

    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Bu alan zorunludur' }));
      return;
    }

    await login({ email, password, rememberMe }).catch(() => {
      // Error state handled centrally; no-op here.
    });
  };

  const emailError = errors.email || fieldErrors.email;
  const passwordError = errors.password || fieldErrors.password;
  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tekrar Hoş Geldiniz</h1>
          <p className="text-muted-foreground mt-2">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
            placeholder="E-posta"
          />

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required
            placeholder="Şifre"
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

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-input text-primary focus:ring-ring"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="ml-2 text-sm text-muted-foreground">Beni hatırla</span>
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            Giriş Yap
          </Button>
        </form>
      </Card>
    </div>
  );
};
