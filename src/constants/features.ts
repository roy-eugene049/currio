export const FEATURES = {
  remoteCurios: process.env.EXPO_PUBLIC_REMOTE_CURIOS === 'true',
  aiGeneration: process.env.EXPO_PUBLIC_AI_CURIOS === 'true',
} as const;
