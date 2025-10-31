import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BellRing,
  Grid,
  Layers,
  Loader2,
  Package,
  Search as SearchIcon,
  SlidersHorizontal,
  Tags,
  Users,
} from 'lucide-react';
import { searchService } from '../../api/services/search.service';
import type { SearchEntityType, SearchHit } from '../../api/types/api.types';
import type { ApiError } from '../../api/types/api.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';

const ENTITY_ORDER: SearchEntityType[] = [
  'item',
  'item_type',
  'category',
  'family',
  'attribute_group',
  'attribute',
  'user',
  'notification_rule',
];

const transformHighlight = (highlight?: Record<string, string[]>): string | null => {
  if (!highlight) {
    return null;
  }

  for (const fragments of Object.values(highlight)) {
    if (Array.isArray(fragments) && fragments.length > 0) {
      return fragments[0]
        .replace(/<em>/g, '<mark class="bg-primary/10 text-primary font-semibold">')
        .replace(/<\/em>/g, '</mark>');
    }
  }

  return null;
};

const resolveTitle = (hit: SearchHit): string => hit.title?.tr || hit.title?.en || '';
const resolveDescription = (hit: SearchHit): string => hit.description?.tr || hit.description?.en || '';

export const SearchResults: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const selectedParam = (searchParams.get('entityType') as SearchEntityType | null) ?? null;

  const [selectedEntity, setSelectedEntity] = useState<SearchEntityType | 'all'>(selectedParam ?? 'all');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedEntity(selectedParam ?? 'all');
  }, [selectedParam]);

  const entityMetadata = useMemo(
    () =>
      ({
        item: { label: t('navigation.items'), icon: Package },
        item_type: { label: t('navigation.item_types'), icon: Layers },
        category: { label: t('navigation.categories'), icon: Tags },
        family: { label: t('navigation.families'), icon: Layers },
        attribute_group: { label: t('navigation.attribute_groups'), icon: Grid },
        attribute: { label: t('navigation.attributes'), icon: SlidersHorizontal },
        user: { label: t('navigation.users'), icon: Users },
        notification_rule: { label: t('navigation.notifications'), icon: BellRing },
      }) as Record<SearchEntityType, { label: string; icon: React.ComponentType<{ className?: string }> }>,
    [t],
  );

  const entityFilters = useMemo(
    () => [
      { value: 'all' as const, label: t('common.all') || 'Tümü' },
      ...ENTITY_ORDER.map((type) => ({
        value: type,
        label: entityMetadata[type]?.label ?? type,
      })),
    ],
    [entityMetadata, t],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchResults = async () => {
      try {
        const response = await searchService.unified({
          query: trimmed,
          limit: 40,
          entityTypes: selectedEntity === 'all' ? undefined : [selectedEntity],
        });
        if (cancelled) {
          return;
        }
        setResults(response.data.items ?? []);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const apiError = err as ApiError | undefined;
        setError(apiError?.message ?? t('common.error'));
        setResults([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchResults();

    return () => {
      cancelled = true;
    };
  }, [query, selectedEntity, t]);

  const groupedResults = useMemo(() => {
    const buckets = new Map<SearchEntityType, SearchHit[]>();
    results.forEach((hit) => {
      const bucket = buckets.get(hit.entityType) ?? [];
      bucket.push(hit);
      buckets.set(hit.entityType, bucket);
    });

    const entries = Array.from(buckets.entries());
    entries.sort((a, b) => ENTITY_ORDER.indexOf(a[0]) - ENTITY_ORDER.indexOf(b[0]));
    return entries;
  }, [results]);

  const handleFilterChange = (value: SearchEntityType | 'all') => {
    setSelectedEntity(value);
    const trimmed = query.trim();
    const params: Record<string, string> = {};
    if (trimmed.length > 0) {
      params.q = trimmed;
    }
    if (value !== 'all') {
      params.entityType = value;
    }
    setSearchParams(params, { replace: true });
  };

  const trimmedQuery = query.trim();

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('common.search')}</h1>
          <p className="text-sm text-muted-foreground">
            {trimmedQuery.length >= 2
              ? `“${trimmedQuery}” ${t('common.results') || 'sonuçları'}`
              : 'En az 2 karakter girerek arama yapabilirsiniz.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {entityFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedEntity === filter.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {trimmedQuery.length < 2 ? (
        <div className="rounded-lg border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Arama başlatmak için en az 2 karakter giriniz.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : groupedResults.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          {t('common.no_results')}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedResults.map(([entityType, items]) => {
            const meta = entityMetadata[entityType];
            const Icon = meta?.icon ?? SearchIcon;

            return (
              <section key={entityType} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">{meta?.label ?? entityType}</h2>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="grid gap-3">
                  {items.map((hit) => {
                    const highlightHtml = transformHighlight(hit.highlight);
                    const description = resolveDescription(hit);
                    return (
                      <button
                        key={`${entityType}-${hit.id}`}
                        type="button"
                        onClick={() => navigate(hit.route)}
                        className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {resolveTitle(hit) || hit.route}
                          </p>
                          <span className="text-xs text-muted-foreground truncate">{hit.route}</span>
                        </div>
                        {highlightHtml ? (
                          <p
                            className="mt-2 text-xs leading-relaxed text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: highlightHtml }}
                          />
                        ) : description ? (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{description}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>ID: {hit.id}</span>
                          {typeof hit.score === 'number' && (
                            <span>Skor: {hit.score.toFixed(2)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
