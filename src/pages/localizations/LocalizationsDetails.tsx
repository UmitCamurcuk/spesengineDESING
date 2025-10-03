import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Globe, Languages, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Localization } from '../../types';

// Mock data
const mockLocalization: Localization = {
  id: '1',
  key: 'common.save',
  translations: {
    en: 'Save',
    tr: 'Kaydet',
    es: 'Guardar',
    fr: 'Enregistrer',
  },
  namespace: 'common',
  description: 'Save button text',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

const namespaceOptions = [
  { value: 'common', label: 'Common' },
  { value: 'items', label: 'Items' },
  { value: 'categories', label: 'Categories' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'validation', label: 'Validation' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'forms', label: 'Forms' },
  { value: 'messages', label: 'Messages' },
];

const availableLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export const LocalizationsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [localization, setLocalization] = useState(mockLocalization);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setTimeout(() => {
      setEditMode(false);
      setLoading(false);
    }, 1000);
  };

  const updateTranslation = (languageCode: string, value: string) => {
    setLocalization(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageCode]: value
      }
    }));
  };

  const addLanguage = (languageCode: string) => {
    setLocalization(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageCode]: ''
      }
    }));
  };

  const removeLanguage = (languageCode: string) => {
    if (languageCode === 'en') return; // Don't allow removing English
    
    setLocalization(prev => {
      const newTranslations = { ...prev.translations };
      delete newTranslations[languageCode];
      return {
        ...prev,
        translations: newTranslations
      };
    });
  };

  const selectedLanguages = Object.keys(localization.translations);
  const availableToAdd = availableLanguages.filter(lang => !selectedLanguages.includes(lang.code));

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Localization Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Translation Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-mono">{localization.key}</h3>
                  <p className="text-sm text-gray-500">ID: {localization.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Namespace</label>
                  <div className="mt-1">
                    <Badge variant="primary">
                      {localization.namespace}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Languages</label>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <Languages className="h-4 w-4 mr-2 text-gray-400" />
                    {Object.keys(localization.translations).length} languages
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(localization.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(localization.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Translation Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Translation Details" 
              subtitle="Manage translation information"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Translation Key"
                    value={localization.key}
                    onChange={(e) => setLocalization(prev => ({ ...prev, key: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Namespace"
                    value={localization.namespace}
                    onChange={(e) => setLocalization(prev => ({ ...prev, namespace: e.target.value }))}
                    options={namespaceOptions}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={localization.description || ''}
                    onChange={(e) => setLocalization(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
              </div>

              {editMode && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Translations */}
          <Card>
            <CardHeader 
              title="Translations" 
              subtitle="Manage translations for different languages"
            />
            <div className="space-y-4">
              {selectedLanguages.map(languageCode => {
                const language = availableLanguages.find(lang => lang.code === languageCode);
                return (
                  <div key={languageCode} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                      <span className="text-2xl">{language?.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{language?.name}</p>
                        <p className="text-xs text-gray-500">{languageCode.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={localization.translations[languageCode]}
                        onChange={(e) => updateTranslation(languageCode, e.target.value)}
                        disabled={!editMode}
                        placeholder={`Enter ${language?.name} translation`}
                      />
                    </div>
                    {editMode && languageCode !== 'en' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLanguage(languageCode)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Add Language */}
              {editMode && availableToAdd.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add More Languages</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableToAdd.map(language => (
                      <button
                        key={language.code}
                        onClick={() => addLanguage(language.code)}
                        className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                      >
                        <span className="text-xl">{language.flag}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{language.name}</p>
                          <p className="text-xs text-gray-500">{language.code.toUpperCase()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};