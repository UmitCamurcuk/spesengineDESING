import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Edit2, Save, Plus, Trash2, Eye } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { DocumentationSection } from '../../types/common';

interface DocumentationProps {
  entityType: string;
  entityId: string;
  sections?: DocumentationSection[];
  editMode?: boolean;
  onSave?: (sections: DocumentationSection[]) => Promise<void> | void;
}

const defaultSections: DocumentationSection[] = [
  {
    id: 'overview',
    title: 'Genel Bakış',
    content: `# Bildirim Kuralları

Bu kaynak, tenant bazında olay tabanlı bildirim akışını yönetmek için kullanılır.`,
    order: 0,
    type: 'markdown',
    lastUpdated: new Date().toISOString(),
    author: 'System',
  },
];

const renderMarkdown = (content: string) =>
  content
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-foreground mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-foreground mb-3 mt-6">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-foreground mb-2 mt-4">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg overflow-x-auto my-4 p-4"><code class="text-sm text-foreground">$2</code></pre>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-muted-foreground">• $1</li>')
    .replace(/\n/g, '<br>');

export const Documentation: React.FC<DocumentationProps> = ({
  entityType,
  sections: sectionsProp,
  editMode = false,
  onSave,
}) => {
  const initialSections = useMemo(
    () => (sectionsProp && sectionsProp.length > 0 ? sectionsProp : defaultSections),
    [sectionsProp],
  );

  const [sections, setSections] = useState<DocumentationSection[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<DocumentationSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSections(initialSections);
    setSelectedSectionId(initialSections[0]?.id ?? null);
    setIsEditing(false);
    setEditingSection(null);
  }, [initialSections]);

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  const beginEdit = (section: DocumentationSection) => {
    if (!editMode) {
      return;
    }
    setEditingSection({ ...section });
    setIsEditing(true);
  };

  const handleAddSection = () => {
    if (!editMode) {
      return;
    }
    const newSection: DocumentationSection = {
      id: `section-${Date.now()}`,
      title: 'Yeni Bölüm',
      content: `# Yeni Bölüm

İçeriği düzenleyin...`,
      order: sections.length,
      type: 'markdown',
      lastUpdated: new Date().toISOString(),
      author: 'System',
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setEditingSection(newSection);
    setIsEditing(true);
  };

  const persistSections = async (nextSections: DocumentationSection[]) => {
    if (!onSave) {
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      await onSave(nextSections);
    } catch (error: any) {
      setSaveError(error?.message ?? 'Dokümantasyon kaydedilirken bir hata oluştu');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) {
      return;
    }
    const previous = sections;
    const next = sections.map((section) =>
      section.id === editingSection.id ? { ...editingSection, lastUpdated: new Date().toISOString() } : section,
    );
    try {
      setSections(next);
      setSelectedSectionId(editingSection.id);
      setIsEditing(false);
      setEditingSection(null);
      await persistSections(next);
    } catch (_error) {
      setSections(previous);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const previous = sections;
    const next = sections.filter((section) => section.id !== sectionId).map((section, index) => ({
      ...section,
      order: index,
    }));
    try {
      setSections(next.length > 0 ? next : defaultSections);
      setSelectedSectionId(next[0]?.id ?? null);
      await persistSections(next.length > 0 ? next : defaultSections);
    } catch (_error) {
      setSections(previous);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Documentation</h3>
          <p className="text-sm text-muted-foreground">{entityType} için operasyonel ve permission rehberi</p>
        </div>
        {editMode && (
          <div className="flex items-center gap-2">
            {saveError && <span className="text-sm text-error">{saveError}</span>}
            <Button onClick={handleAddSection} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Yeni Bölüm
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Bölümler" subtitle="Dokümantasyon bölümlerini seçin" />
            <div className="divide-y divide-border">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setIsEditing(false);
                    setEditingSection(null);
                  }}
                  className={`w-full p-3 text-left transition ${
                    section.id === selectedSectionId ? 'bg-primary/5 text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.lastUpdated ? new Date(section.lastUpdated).toLocaleString() : '—'}
                      </p>
                    </div>
                    {editMode && (
                      <Badge variant="secondary" size="sm">#{section.order + 1}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader
              title={selectedSection?.title ?? 'Seçili bölüm yok'}
              subtitle={selectedSection ? 'Detayları görüntüleyin veya düzenleyin' : 'Sol taraftan bir bölüm seçin'}
              actions={
                selectedSection && editMode ? (
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <Button size="sm" variant="outline" onClick={() => beginEdit(selectedSection)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Düzenle
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSection(selectedSection.id)}
                      disabled={saving}
                      className="text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Sil
                    </Button>
                  </div>
                ) : undefined
              }
            />
            <div className="p-6 space-y-6">
              {selectedSection ? (
                isEditing && editingSection ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Başlık</label>
                      <Input
                        value={editingSection.title}
                        onChange={(event) => setEditingSection({ ...editingSection, title: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">İçerik (Markdown)</label>
                      <Textarea
                        value={editingSection.content}
                        onChange={(event) => setEditingSection({ ...editingSection, content: event.target.value })}
                        rows={12}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveSection} loading={saving}>
                        <Save className="h-4 w-4 mr-2" /> Kaydet
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingSection(null);
                        }}
                        disabled={saving}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Son güncelleme: {selectedSection.lastUpdated ? new Date(selectedSection.lastUpdated).toLocaleString() : '—'}</span>
                      <span>Yazar: {selectedSection.author ?? 'Tanımsız'}</span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedSection.content) }}
                    />
                    {!editMode && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" /> Görüntüleme modundasınız
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">Görüntülenecek bölüm bulunamadı.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
