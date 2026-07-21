import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

import {
  CURIO_SHARE_CARD_HEIGHT,
  CURIO_SHARE_CARD_WIDTH,
  CurioShareCard,
} from '@/components/share/CurioShareCard';
import type { Curio } from '@/types/curio';
import { shareCurioImage, shareCurioText } from '@/utils/shareCurio';

const CAPTURE_TIMEOUT_MS = 2500;

export function CurioShareCapturePortal({
  curio,
  shotRef,
}: {
  curio: Curio;
  shotRef: React.RefObject<ViewShot | null>;
}): ReactElement {
  return (
    <View style={styles.captureHost} pointerEvents="none" collapsable={false}>
      <ViewShot
        ref={shotRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shot}
      >
        <CurioShareCard curio={curio} />
      </ViewShot>
    </View>
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

export function useShareCurio(curio: Curio) {
  const shotRef = useRef<ViewShot | null>(null);
  const inFlightRef = useRef(false);
  const [mountCapture, setMountCapture] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingShareRef = useRef(false);
  const curioRef = useRef(curio);
  curioRef.current = curio;

  const finish = useCallback(() => {
    inFlightRef.current = false;
    pendingShareRef.current = false;
    setBusy(false);
    setMountCapture(false);
  }, []);

  const runShare = useCallback(async () => {
    const activeCurio = curioRef.current;

    try {
      await waitForPaint();

      const capture = shotRef.current?.capture;
      let uri: string | null = null;

      if (capture) {
        uri = await withTimeout(capture(), CAPTURE_TIMEOUT_MS);
      }

      // Unlock UI before the native share sheet appears.
      setBusy(false);
      setMountCapture(false);

      try {
        if (uri) {
          await shareCurioImage(uri, activeCurio);
        } else {
          await shareCurioText(activeCurio);
        }
      } catch {
        // Dismissed share sheet or target app error — ignore.
      }
    } finally {
      finish();
    }
  }, [finish]);

  useEffect(() => {
    if (!mountCapture || !pendingShareRef.current) return;
    void runShare();
  }, [mountCapture, runShare]);

  const share = useCallback(() => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    pendingShareRef.current = true;
    setBusy(true);
    setMountCapture(true);
  }, []);

  const capturePortal = mountCapture ? (
    <CurioShareCapturePortal curio={curio} shotRef={shotRef} />
  ) : null;

  return { share, busy, capturePortal };
}

const styles = StyleSheet.create({
  captureHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CURIO_SHARE_CARD_WIDTH,
    height: CURIO_SHARE_CARD_HEIGHT,
    opacity: 0,
    zIndex: -1,
  },
  shot: {
    width: CURIO_SHARE_CARD_WIDTH,
    height: CURIO_SHARE_CARD_HEIGHT,
  },
});
