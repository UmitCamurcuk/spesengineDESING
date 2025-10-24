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
            // Manuel çeviri mapping
            const fieldTranslations: Record<string, string> = {
              'companyName': t('settings_fields.companyName') || 'Şirket Adı',
              'timezone': t('settings_fields.timezone') || 'Saat Dilimi',
              'dateFormat': t('settings_fields.dateFormat') || 'Tarih Formatı',
              'maintenanceMode': t('settings_fields.maintenanceMode') || 'Bakım Modu',
              'themeMode': t('settings_fields.themeMode') || 'Tema Modu',
              'language': t('settings_fields.language') || 'Dil',
              'emailNotifications': t('settings_fields.emailNotifications') || 'E-posta Bildirimleri',
              'pushNotifications': t('settings_fields.pushNotifications') || 'Anlık Bildirimler',
              'twoFactorAuth': t('settings_fields.twoFactorAuth') || 'İki Faktörlü Kimlik Doğrulama',
              'sessionTimeout': t('settings_fields.sessionTimeout') || 'Oturum Zaman Aşımı',
              'apiRateLimit': t('settings_fields.apiRateLimit') || 'API Hız Sınırı',
              'backupFrequency': t('settings_fields.backupFrequency') || 'Yedekleme Sıklığı',
              'logLevel': t('settings_fields.logLevel') || 'Log Seviyesi',
              'debugMode': t('settings_fields.debugMode') || 'Hata Ayıklama Modu',
              'autoSave': t('settings_fields.autoSave') || 'Otomatik Kaydetme',
              'confirmChanges': t('settings_fields.confirmChanges') || 'Değişiklikleri Onayla',
              'showTooltips': t('settings_fields.showTooltips') || 'İpucu Göster',
              'compactView': t('settings_fields.compactView') || 'Kompakt Görünüm',
              'sidebarCollapsed': t('settings_fields.sidebarCollapsed') || 'Kenar Çubuğu Daraltılmış',
              'gridDensity': t('settings_fields.gridDensity') || 'Grid Yoğunluğu',
              'defaultPageSize': t('settings_fields.defaultPageSize') || 'Varsayılan Sayfa Boyutu',
              'enableAnimations': t('settings_fields.enableAnimations') || 'Animasyonları Etkinleştir',
              'showWelcomeMessage': t('settings_fields.showWelcomeMessage') || 'Hoş Geldin Mesajını Göster',
              'enableKeyboardShortcuts': t('settings_fields.enableKeyboardShortcuts') || 'Klavye Kısayollarını Etkinleştir',
              'autoRefresh': t('settings_fields.autoRefresh') || 'Otomatik Yenileme',
              'enableDarkMode': t('settings_fields.enableDarkMode') || 'Karanlık Modu Etkinleştir',
              'enableNotifications': t('settings_fields.enableNotifications') || 'Bildirimleri Etkinleştir',
              'enableSounds': t('settings_fields.enableSounds') || 'Sesleri Etkinleştir',
              'enableVibrations': t('settings_fields.enableVibrations') || 'Titreşimi Etkinleştir'
            };
            
            const displayKey = fieldTranslations[key] || key;
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
            <p className="text-muted-foreground">{t('changes_modal_no_changes')}</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">{title || t('changes_modal_title')}</h3>
          <p className="text-sm text-muted-foreground">
            {changes.length} {t('changes_modal_count')}
          </p>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {changes.map((change, index) => (
            <div key={`${change.field}-${index}`} className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-foreground">{t('changes_modal_field')}: {change.field}</h4>
                {renderChangeMedia(change.newValue, `${change.field}-after`)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {t('changes_modal_before')}
                  </div>
                  <div className="bg-error/10 border border-error/20 rounded-md p-3">
                    <div className="text-error line-through text-sm whitespace-pre-wrap">
                      {renderChangeMedia(change.oldValue, `${change.field}-before`) || formatChangeValue(change.oldValue, change.field, t)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {t('changes_modal_after')}
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
            {t('changes_modal_close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
