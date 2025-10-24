import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { HistoryChange } from '../../types/common';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  changes: HistoryChange[];
  title?: string;
}

const formatChangeValue = (value: unknown, field: string, t: (key: string) => string): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      const obj = value as Record<string, any>;
      
      // Özel alanlar için daha anlaşılır format
      if (field === 'general' || field === 'appearance' || field === 'localization') {
        return Object.entries(obj)
          .map(([key, val]) => {
            // Manuel çeviri mapping - hardcoded değerler
            const fieldTranslations: Record<string, string> = {
              'companyName': 'Şirket Adı',
              'timezone': 'Saat Dilimi',
              'dateFormat': 'Tarih Formatı',
              'maintenanceMode': 'Bakım Modu',
              'themeMode': 'Tema Modu',
              'language': 'Dil',
              'defaultLanguage': 'Varsayılan Dil',
              'fallbackLanguage': 'Yedek Dil',
              'supportedLanguages': 'Desteklenen Diller',
              'allowUserLanguageSwitch': 'Kullanıcı Dil Değiştirme',
              'autoTranslateNewContent': 'Otomatik Çeviri',
              'emailNotifications': 'E-posta Bildirimleri',
              'pushNotifications': 'Anlık Bildirimler',
              'twoFactorAuth': 'İki Faktörlü Kimlik Doğrulama',
              'sessionTimeout': 'Oturum Zaman Aşımı',
              'apiRateLimit': 'API Hız Sınırı',
              'backupFrequency': 'Yedekleme Sıklığı',
              'logLevel': 'Log Seviyesi',
              'debugMode': 'Hata Ayıklama Modu',
              'autoSave': 'Otomatik Kaydetme',
              'confirmChanges': 'Değişiklikleri Onayla',
              'showTooltips': 'İpucu Göster',
              'compactView': 'Kompakt Görünüm',
              'sidebarCollapsed': 'Kenar Çubuğu Daraltılmış',
              'gridDensity': 'Grid Yoğunluğu',
              'defaultPageSize': 'Varsayılan Sayfa Boyutu',
              'enableAnimations': 'Animasyonları Etkinleştir',
              'showWelcomeMessage': 'Hoş Geldin Mesajını Göster',
              'enableKeyboardShortcuts': 'Klavye Kısayollarını Etkinleştir',
              'autoRefresh': 'Otomatik Yenileme',
              'enableDarkMode': 'Karanlık Modu Etkinleştir',
              'enableNotifications': 'Bildirimleri Etkinleştir',
              'enableSounds': 'Sesleri Etkinleştir',
              'enableVibrations': 'Titreşimi Etkinleştir'
            };
            
            const displayKey = fieldTranslations[key] || key;
            
            // Array değerleri için özel format
            if (Array.isArray(val)) {
              const formattedArray = val.map(item => {
                if (typeof item === 'object' && item !== null) {
                  // Object array'i için özel format
                  if (item.code && item.label) {
                    return `${item.code} (${item.label})`;
                  }
                  return JSON.stringify(item);
                }
                return String(item);
              }).join(', ');
              return `${displayKey}: [${formattedArray}]`;
            }
            
            return `${displayKey}: ${val}`;
          })
          .join('\n');
      }
      
      return JSON.stringify(obj, null, 2);
    } catch (_error) {
      return '[object]';
    }
  }

  return String(value);
};

const isImageValue = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('data:')) {
    return normalized.startsWith('data:image');
  }
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(normalized) || normalized.startsWith('/uploads/');
};

const renderChangeMedia = (value: unknown, label: string) => {
  if (!isImageValue(value)) {
    return null;
  }

  const apiBase = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  const src = value.startsWith('http') ? value : `${apiBase}${value}`;

  return (
    <img
      src={src}
      alt={label}
      className="h-16 w-16 rounded-md object-cover border border-border"
      referrerPolicy="no-referrer"
    />
  );
};

export const ChangesModal: React.FC<ChangesModalProps> = ({
  isOpen,
  onClose,
  changes,
  title
}) => {
  const { t } = useLanguage();

  if (!changes || changes.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Değişiklik bulunamadı</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">{title || 'Değişiklik Detayları'}</h3>
          <p className="text-sm text-muted-foreground">
            {changes.length} değişiklik gösteriliyor
          </p>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {changes.map((change, index) => (
            <div key={`${change.field}-${index}`} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-foreground">Alan: {change.field}</h4>
                {renderChangeMedia(change.newValue, `${change.field}-after`)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Önce
                  </div>
                  <div className="bg-error/10 border border-error/20 rounded-md p-3">
                    <div className="text-error line-through text-sm whitespace-pre-wrap">
                      {renderChangeMedia(change.oldValue, `${change.field}-before`) || formatChangeValue(change.oldValue, change.field, t)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Sonra
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-md p-3">
                    <div className="text-success text-sm whitespace-pre-wrap">
                      {renderChangeMedia(change.newValue, `${change.field}-after`) || formatChangeValue(change.newValue, change.field, t)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Modal>
  );
};
