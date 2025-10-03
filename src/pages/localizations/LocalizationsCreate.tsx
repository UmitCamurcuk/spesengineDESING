import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Globe, Languages, Plus, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Key and namespace' },
  { id: 'translations', name: 'Translations', description: 'Add translations' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

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

export const LocalizationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    namespace: 'common',
    description: '',
    translations: { en: '' } as Record<string, string>,
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/localizations');
    }, 2000);
  };

  const addLanguage = (languageCode: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageCode]: ''
      }
    }));
  };

  const removeLanguage = (languageCode: string) => {
    if (languageCode === 'en') return; // Don't allow removing English
    
    setFormData(prev => {
      const newTranslations = { ...prev.translations };
      delete newTranslations[languageCode];
      return {
        ...prev,
        translations: newTranslations
      };
    });
  };

  const updateTranslation = (languageCode: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageCode]: value
      }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.key.trim() !== '' && formData.namespace !== '';
      case 1:
        return Object.values(formData.translations).some(translation => translation.trim() !== '');
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Translation Information" 
              subtitle="Define the basic properties of your translation"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Translation Key"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g., common.save, items.create_title"
                    required
                    helperText="Use dot notation for nested keys (namespace.key)"
                  />
                  <Select
                    label="Namespace"
                    value={formData.namespace}
                    onChange={(e) => setFormData(prev => ({ ...prev, namespace: e.target.value }))}
                    options={namespaceOptions}
                    required
                    helperText="Group related translations together"
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe where this translation is used"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        const selectedLanguages = Object.keys(formData.translations);
        const availableToAdd = availableLanguages.filter(lang => !selectedLanguages.includes(lang.code));

        return (
          <Card>
            <CardHeader 
              title="Add Translations" 
              subtitle="Provide translations for different languages"
            />
            <div className="space-y-6">
              {/* Current Translations */}
              <div className="space-y-4">
                {selectedLanguages.map(languageCode => {
                  const language = availableLanguages.find(lang => lang.code === languageCode);
                  return (
                    <div key={languageCode} className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                        <span className="text-2xl">{language?.flag}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{language?.name}</p>
                          <p className="text-xs text-gray-500">{languageCode.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={formData.translations[languageCode]}
                          onChange={(e) => updateTranslation(languageCode, e.target.value)}
                          placeholder={`Enter ${language?.name} translation`}
                        />
                      </div>
                      {languageCode !== 'en' && (
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
              </div>

              {/* Add Language */}
              {availableToAdd.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
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
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your translation details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Key:</span> <code className="font-mono text-sm">{formData.key}</code></p>
                    <p><span className="text-gray-500">Namespace:</span> <Badge variant="primary" size="sm">{formData.namespace}</Badge></p>
                    {formData.description && (
                      <p><span className="text-gray-500">Description:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Languages</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Total Languages:</span> {Object.keys(formData.translations).length}</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(formData.translations).map(languageCode => {
                        const language = availableLanguages.find(lang => lang.code === languageCode);
                        return (
                          <Badge key={languageCode} variant="secondary" size="sm">
                            {language?.flag} {language?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Translations</h4>
                <div className="space-y-3">
                  {Object.entries(formData.translations).map(([languageCode, translation]) => {
                    const language = availableLanguages.find(lang => lang.code === languageCode);
                    return (
                      <div key={languageCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{language?.flag}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{language?.name}</p>
                            <p className="text-xs text-gray-500">{languageCode.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-900 italic max-w-xs truncate">
                          "{translation || 'No translation provided'}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        
        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canProceed()}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Create Translation
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};