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

/**
 * Profile / library surfaces.
 * Dark text uses mist/pale (not lavender-on-purple). Lavender stays for borders & glows.
 */
export function useProfilePalette(isDark: boolean): ProfilePalette {
  return useMemo(
    () =>
      isDark
        ? {
            gradient: [BRAND.deep, '#3D0E7A', BRAND.deepMuted],
            orbOpacity: 0.1,
            kicker: `${BRAND.mist}99`,
            displayName: BRAND.mist,
            email: `${BRAND.mist}BB`,
            avatarBg: BRAND.deepMuted,
            memberPillBg: `${BRAND.electric}33`,
            memberPillBorder: `${BRAND.lavender}44`,
            memberText: BRAND.mist,
            bentoBorder: [`${BRAND.electric}44`, `${BRAND.lavender}18`],
            bentoInner: `${BRAND.deep}CC`,
            bentoIcon: BRAND.pale,
            bentoValue: BRAND.mist,
            bentoLabel: `${BRAND.mist}AA`,
            sectionTag: BRAND.pale,
            tileBg: `${BRAND.deepMuted}EE`,
            tileBorder: `${BRAND.lavender}28`,
            tileTitle: BRAND.mist,
            tileSubtitle: `${BRAND.mist}AA`,
            tileAccent: [`${BRAND.electric}44`, `${BRAND.pale}22`],
            iconWrapBg: `${BRAND.electric}28`,
            blurTint: 'dark',
          }
        : {
            gradient: [...LIGHT.gradient.profile],
            orbOpacity: 0.1,
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
            sectionTag: LIGHT.textSecondary,
            tileBg: LIGHT.surface,
            tileBorder: LIGHT.border,
            tileTitle: LIGHT.text,
            tileSubtitle: LIGHT.textMuted,
            tileAccent: [`${BRAND.electric}22`, `${BRAND.lavender}40`],
            iconWrapBg: `${BRAND.electric}10`,
            blurTint: 'light',
          },
    [isDark],
  );
}
