import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ItemsList } from './ItemsList';
import { itemTypesService } from '../../api/services/item-types.service';
import type { ItemType } from '../../types';

export const ItemsListByType: React.FC = () => {
  const { itemTypeId } = useParams<{ itemTypeId: string }>();
  const [itemType, setItemType] = useState<ItemType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!itemTypeId) return;
      try {
        const resp = await itemTypesService.getById(itemTypeId);
        if (!cancelled) setItemType(resp);
      } catch {
        if (!cancelled) setItemType(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [itemTypeId]);

  return (
    <ItemsList
      forcedItemTypeId={itemTypeId}
      titleOverride={itemType?.name || itemType?.key || itemTypeId || undefined}
      subtitleOverride={itemType ? itemType.key : undefined}
      alwaysShowFilterBadge
    />
  );
};

export default ItemsListByType;
