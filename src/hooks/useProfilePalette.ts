import { useMemo } from 'react';

import { BRAND } from '@/theme/brand';
import { LIGHT } from '@/theme/lightPalette';

export type ProfilePalette = {
  gradient: [string, string, string];
  orbOpacity: number;
  kicker: string;
  displayName: string;
  email: string;
  avatarBg: string;
  memberPillBg: string;
  memberPillBorder: string;
  memberText: string;
  bentoBorder: [string, string];
  bentoInner: string;
  bentoIcon: string;
  bentoValue: string;
  bentoLabel: string;
  sectionTag: string;
  tileBg: string;
  tileBorder: string;
  tileTitle: string;
  tileSubtitle: string;
  tileAccent: [string, string];
  iconWrapBg: string;
  blurTint: 'light' | 'dark';
};

export function useProfilePalette(isDark: boolean): ProfilePalette {
  return useMemo(
    () =>
      isDark
        ? {
            gradient: [BRAND.deep, '#1E0040', BRAND.deepMuted],
            orbOpacity: 0.12,
            kicker: `${BRAND.lavender}99`,
            displayName: BRAND.mist,
            email: `${BRAND.lavender}BB`,
            avatarBg: BRAND.deepMuted,
            memberPillBg: `${BRAND.electric}33`,
            memberPillBorder: `${BRAND.lavender}44`,
            memberText: BRAND.lavender,
            bentoBorder: [`${BRAND.electric}44`, `${BRAND.lavender}18`],
            bentoInner: `${BRAND.deep}AA`,
            bentoIcon: BRAND.lavender,
            bentoValue: BRAND.mist,
            bentoLabel: `${BRAND.lavender}CC`,
            sectionTag: `${BRAND.electric}CC`,
            tileBg: `${BRAND.deepMuted}CC`,
            tileBorder: `${BRAND.lavender}22`,
            tileTitle: BRAND.mist,
            tileSubtitle: `${BRAND.lavender}AA`,
            tileAccent: [`${BRAND.lavender}33`, `${BRAND.electric}22`],
            iconWrapBg: `${BRAND.electric}22`,
            blurTint: 'dark',
          }
        : {
            gradient: [...LIGHT.gradient.profile],
            orbOpacity: 0.14,
            kicker: LIGHT.textMuted,
            displayName: LIGHT.text,
            email: LIGHT.textSecondary,
            avatarBg: LIGHT.surface,
            memberPillBg: `${BRAND.electric}12`,
            memberPillBorder: LIGHT.borderStrong,
            memberText: LIGHT.textSecondary,
            bentoBorder: [`${BRAND.electric}40`, `${BRAND.lavender}70`],
            bentoInner: LIGHT.surface,
            bentoIcon: BRAND.electric,
            bentoValue: LIGHT.text,
            bentoLabel: LIGHT.textMuted,
            sectionTag: BRAND.electric,
            tileBg: LIGHT.surface,
            tileBorder: LIGHT.border,
            tileTitle: LIGHT.text,
            tileSubtitle: LIGHT.textMuted,
            tileAccent: [`${BRAND.lavender}70`, `${BRAND.electric}12`],
            iconWrapBg: `${BRAND.electric}10`,
            blurTint: 'light',
          },
    [isDark],
  );
}
