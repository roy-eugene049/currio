import { StyleSheet, View } from 'react-native';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
  tabIndex: number;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
