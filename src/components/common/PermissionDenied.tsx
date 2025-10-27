import React from 'react';
import { ShieldOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PermissionDeniedProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ title, description, action }) => {
  const { language } = useLanguage();
  const isTurkish = language === 'tr';

  const resolvedTitle = title ?? (isTurkish ? 'Bu alana erişim yetkiniz yok' : 'Access denied');
  const resolvedDescription = description ?? (isTurkish
    ? 'Görüntülemeye çalıştığınız içerik için gerekli yetkilere sahip değilsiniz. Lütfen yönetici ile iletişime geçin.'
    : 'You do not have the required permissions to view this content. Please contact your administrator.');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
        <ShieldOff className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-foreground">{resolvedTitle}</h2>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">{resolvedDescription}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};

export default PermissionDenied;
