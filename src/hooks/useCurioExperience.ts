import { useEffect, useState } from 'react';

import {
  isCurioExperiencePrepared,
  peekCurioBackdropUrl,
  prepareCurioExperience,
} from '@/services/curioImageService';
import type { Curio } from '@/types/curio';

type ExperienceState = {
  isReady: boolean;
  backdropUrl: string | null;
};

function syncState(curio: Curio | undefined): ExperienceState | null {
  if (!curio) return { isReady: false, backdropUrl: null };
  if (isCurioExperiencePrepared(curio.id)) {
    return { isReady: true, backdropUrl: peekCurioBackdropUrl(curio.id) ?? null };
  }
  return null;
}

/**
 * Ensures backdrop URL + bitmap cache are ready before revealing the reader.
 */
export function useCurioExperience(curio: Curio | undefined) {
  const synced = syncState(curio);
  const [readyForId, setReadyForId] = useState<string | null>(null);

  useEffect(() => {
    if (!curio || isCurioExperiencePrepared(curio.id)) {
      return;
    }

    const curioId = curio.id;
    let cancelled = false;

    void prepareCurioExperience(curio).then(() => {
      if (cancelled) return;
      setReadyForId(curioId);
    });

    return () => {
      cancelled = true;
    };
  }, [curio]);

  if (synced) return synced;

  if (curio && readyForId === curio.id) {
    return {
      isReady: true,
      backdropUrl: peekCurioBackdropUrl(curio.id) ?? null,
    };
  }

  return {
    isReady: false,
    backdropUrl: curio ? (peekCurioBackdropUrl(curio.id) ?? null) : null,
  };
}
