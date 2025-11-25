import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BellRing, Loader2, PlusCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationsService, type NotificationRule } from '../../api/services/notifications.service';

interface EntityNotificationsTabProps {
  entityId: string;
  entityType: 'attribute' | 'attribute-group';
  entityName?: string;
  eventKeys?: string[];
}

const DEFAULT_EVENT_KEYS: Record<EntityNotificationsTabProps['entityType'], string[]> = {
  attribute: ['attribute.created', 'attribute.updated', 'attribute.deleted'],
  'attribute-group': ['attribute_group.created', 'attribute_group.updated', 'attribute_group.deleted'],
};

const channelIcon = (channel: string) => {
  switch (channel) {
    case 'slack':
      return '💬';
    case 'email':
      return '📧';
    case 'webhook':
      return '🔗';
    default:
      return '📢';
  }
};

export const EntityNotificationsTab: React.FC<EntityNotificationsTabProps> = ({
  entityId,
  entityType,
  entityName,
  eventKeys,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedEventKeys = eventKeys ?? DEFAULT_EVENT_KEYS[entityType] ?? [];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await notificationsService.listRules();
        setRules(items);
      } catch (err) {
        console.error('Failed to load notification rules', err);
        setError(
          err instanceof Error
            ? err.message
            : t('notifications.errors.failed_to_load') || 'Failed to load notification rules',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [entityId, entityType, t]);

  const matchRule = (rule: NotificationRule) => {
    const filters = rule.filters ?? {};
    const metadata = (rule.metadata ?? {}) as Record<string, any>;
    const entityIdCandidates = [
      filters.entityId,
      filters.attributeId,
      filters.attributeGroupId,
      metadata.entityId,
    ].filter(Boolean);
    const entityTypeCandidates = [
      filters.entityType,
      metadata.entityType,
      metadata.type,
    ].filter(Boolean);

    if (entityIdCandidates.length > 0) {
      const typeMatch =
        entityTypeCandidates.length === 0 || entityTypeCandidates.includes(entityType);
      return typeMatch && entityIdCandidates.includes(entityId);
    }

    if (entityTypeCandidates.includes(entityType)) {
      return true;
    }

    if (resolvedEventKeys.length > 0) {
      return resolvedEventKeys.some((key) => rule.eventKey?.toLowerCase().includes(key));
    }

    return false;
  };

  const entityRules = useMemo(() => rules.filter((rule) => matchRule(rule)), [rules]);

  const targetedRules = useMemo(
    () =>
      entityRules.filter((rule) => {
        const filters = rule.filters ?? {};
        const metadata = (rule.metadata ?? {}) as Record<string, any>;
        return (
          filters.entityId === entityId ||
          filters.attributeId === entityId ||
          filters.attributeGroupId === entityId ||
          metadata.entityId === entityId
        );
      }),
    [entityRules, entityId],
  );

  const uncoveredEvents = useMemo(() => {
    if (resolvedEventKeys.length === 0) {
      return [];
    }
    return resolvedEventKeys.filter(
      (eventKey) => !entityRules.some((rule) => rule.eventKey?.toLowerCase().includes(eventKey)),
    );
  }, [entityRules, resolvedEventKeys]);

  const handleCreateRule = () => {
    const params = new URLSearchParams({
      entityType,
      entityId,
      entityName: entityName ?? '',
    });
    navigate(`/notifications/rules?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
        <Button variant="outline" size="sm" onClick={handleCreateRule}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('notifications.rules.create') || 'Create Rule'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('notifications.entity.title') || 'Entity Notifications'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('notifications.entity.subtitle') ||
              'Review notification rules that target this entity.'}
          </p>
        </div>
        <Button onClick={handleCreateRule} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('notifications.rules.create') || 'Create Rule'}
        </Button>
      </div>

      <Card>
        <CardHeader
          title={t('notifications.entity.summary_title') || 'Summary'}
          subtitle={
            entityName
              ? `${entityName} · ${entityType}`
              : `${t('notifications.entity.type') || 'Type'}: ${entityType}`
          }
        />
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border border-border rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">
              {t('notifications.entity.total_rules') || 'Total matching rules'}
            </p>
            <p className="text-2xl font-semibold text-foreground mt-1">{entityRules.length}</p>
          </div>
          <div className="p-3 border border-border rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">
              {t('notifications.entity.targeted_rules') || 'Targeted rules'}
            </p>
            <p className="text-2xl font-semibold text-foreground mt-1">{targetedRules.length}</p>
          </div>
          <div className="p-3 border border-border rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">
              {t('notifications.entity.coverage') || 'Event coverage'}
            </p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {resolvedEventKeys.length === 0
                ? '—'
                : `${resolvedEventKeys.length - uncoveredEvents.length}/${resolvedEventKeys.length}`}
            </p>
          </div>
        </div>
      </Card>

      {entityRules.length === 0 ? (
        <Card>
          <CardHeader
            title={t('notifications.entity.no_rules_title') || 'No rules configured'}
            subtitle={
              t('notifications.entity.no_rules_description') ||
              'Create a new notification rule to monitor this entity.'
            }
          />
          <div className="p-4">
            <Button onClick={handleCreateRule}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('notifications.rules.create') || 'Create Rule'}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {entityRules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader
                title={rule.name}
                subtitle={rule.description || rule.eventKey}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/notifications/rules/${rule.id}`)}
                  >
                    <BellRing className="h-4 w-4 mr-2" />
                    {t('notifications.rules.view') || 'View'}
                  </Button>
                }
              />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>{rule.eventKey}</span>
                  <Badge variant={rule.isActive ? 'success' : 'secondary'} size="sm">
                    {rule.isActive ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
                  </Badge>
                </div>
                {rule.channels?.length ? (
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {rule.channels.map((channel, index) => (
                      <span
                        key={`${rule.id}-channel-${index}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs"
                      >
                        {channelIcon(channel.channelType)}
                        {channel.channelType}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {uncoveredEvents.length > 0 && (
        <Card>
          <CardHeader
            title={t('notifications.entity.uncovered_events') || 'Uncovered Events'}
            subtitle={
              t('notifications.entity.uncovered_events_desc') ||
              'Consider creating notifications for these events.'
            }
          />
          <div className="p-4 flex flex-wrap gap-2">
            {uncoveredEvents.map((event) => (
              <Badge key={event} variant="secondary" size="sm">
                {event}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
