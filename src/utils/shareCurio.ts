import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';

import type { Curio } from '@/types/curio';

const MAX_BODY_CHARS = 280;

export function formatCurioShareMessage(curio: Curio): string {
  const body =
    curio.content.length > MAX_BODY_CHARS
      ? `${curio.content.slice(0, MAX_BODY_CHARS).trimEnd()}…`
      : curio.content;

  return [
    `Curiosity from Currio`,
    '',
    curio.title,
    '',
    body,
    '',
    `Topic: ${curio.category}`,
    '— Currio',
  ].join('\n');
}

export async function shareCurioText(curio: Curio): Promise<void> {
  const message = formatCurioShareMessage(curio);
  await Share.share(
    Platform.OS === 'ios'
      ? { message }
      : { message, title: curio.title },
  );
}

export async function shareCurioImage(
  imageUri: string,
  curio: Curio,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    await shareCurioText(curio);
    return;
  }

  await Sharing.shareAsync(imageUri, {
    dialogTitle: curio.title,
    mimeType: 'image/png',
    UTI: 'public.png',
  });
}
