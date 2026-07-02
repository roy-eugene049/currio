import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { CategoryTheme } from '@/theme/categoryThemes';

interface CurioBackdropProps {
  theme: CategoryTheme;
}

export function CurioBackdrop({ theme }: CurioBackdropProps) {
  return (
    <View style={styles.root} pointerEvents="none">
      <Image
        source={{ uri: theme.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={350}
      />

      <LinearGradient
        colors={[`${theme.lensEdge}CC`, `${theme.lensMid}AA`, `${theme.lensEdge}DD`]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
