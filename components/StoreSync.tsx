'use client';

import { useEffect } from 'react';
import { updateLocalCache, getData } from '@/lib/store';
import type { StoreData } from '@/lib/types';

export default function StoreSync() {
  useEffect(() => {
    fetch('/api/store')
      .then(r => r.json())
      .then((serverData: StoreData | null) => {
        if (serverData) {
          updateLocalCache(serverData);
          window.dispatchEvent(new Event('store-synced'));
        } else {
          // servidor vazio — migra dados locais (primeiro deploy)
          fetch('/api/store', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getData()),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
