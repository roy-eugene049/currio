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

function initialState(curio: Curio | undefined): ExperienceState {
  if (!curio) return { isReady: false, backdropUrl: null };
  if (isCurioExperiencePrepared(curio.id)) {
    const url = peekCurioBackdropUrl(curio.id);
    return { isReady: true, backdropUrl: url ?? null };
  }
  return { isReady: false, backdropUrl: null };
}

/**
 * Ensures backdrop URL + bitmap cache are ready before revealing the reader.
 */
export function useCurioExperience(curio: Curio | undefined) {
  const [state, setState] = useState<ExperienceState>(() => initialState(curio));

  useEffect(() => {
    if (!curio) {
      setState({ isReady: false, backdropUrl: null });
      return;
    }

    if (isCurioExperiencePrepared(curio.id)) {
      const url = peekCurioBackdropUrl(curio.id);
      setState({ isReady: true, backdropUrl: url ?? null });
      return;
    }

    let cancelled = false;
    const previousUrl = peekCurioBackdropUrl(curio.id);

    setState({
      isReady: false,
      backdropUrl: previousUrl === undefined ? null : (previousUrl ?? null),
    });

    void prepareCurioExperience(curio).then(() => {
      if (cancelled) return;
      const url = peekCurioBackdropUrl(curio.id);
      setState({ isReady: true, backdropUrl: url ?? null });
    });

    return () => {
      cancelled = true;
    };
  }, [curio?.id, curio?.title, curio?.content, curio?.category, curio?.image]);

  return state;
}
