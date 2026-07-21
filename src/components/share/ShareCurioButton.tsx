import { ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useShareCurio } from '@/hooks/useShareCurio';
import type { Curio } from '@/types/curio';

interface ShareCurioButtonProps {
  curio: Curio;
  color: string;
  size?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
}

export function ShareCurioButton({
  curio,
  color,
  size = 20,
  hitSlop = 8,
  accessibilityLabel = 'Share currio',
}: ShareCurioButtonProps) {
  const { share, busy, capturePortal } = useShareCurio(curio);

  return (
    <>
      <Pressable
        onPress={share}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {busy ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name="share-outline" size={size} color={color} />
        )}
      </Pressable>
      {capturePortal}
    </>
  );
}
