import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/constants';
import { BRAND } from '@/theme/brand';
import type { Category, Curio } from '@/types/curio';

export const CURIO_SHARE_CARD_WIDTH = 360;
export const CURIO_SHARE_CARD_HEIGHT = 480;

type ShareLayout = 'classic' | 'orbit' | 'editorial' | 'split' | 'poster';

type SharePalette = {
  from: string;
  mid: string;
  to: string;
  accent: string;
  soft: string;
};

const SHARE_PALETTES: Record<Category, SharePalette> = {
  Technology: { from: '#0B1224', mid: '#1D4ED8', to: '#0F172A', accent: '#93C5FD', soft: '#60A5FA' },
  Space: { from: '#0B0A1F', mid: '#4338CA', to: '#111827', accent: '#A5B4FC', soft: '#818CF8' },
  AI: { from: '#140A28', mid: '#7C3AED', to: '#1E1038', accent: '#C4B5FD', soft: '#A78BFA' },
  History: { from: '#1C1008', mid: '#B45309', to: '#2A160A', accent: '#FCD34D', soft: '#F59E0B' },
  Psychology: { from: '#1E0814', mid: '#DB2777', to: '#2A0F1C', accent: '#F9A8D4', soft: '#F472B6' },
  Philosophy: { from: '#0F1720', mid: '#475569', to: '#1E293B', accent: '#CBD5E1', soft: '#94A3B8' },
  Science: { from: '#04201E', mid: '#0F766E', to: '#083B36', accent: '#5EEAD4', soft: '#2DD4BF' },
  Nature: { from: '#052012', mid: '#15803D', to: '#0A2F18', accent: '#86EFAC', soft: '#4ADE80' },
  Business: { from: '#0A1428', mid: '#1D4ED8', to: '#111C33', accent: '#93C5FD', soft: '#60A5FA' },
  Finance: { from: '#041914', mid: '#047857', to: '#0A2A20', accent: '#6EE7B7', soft: '#34D399' },
  Design: { from: '#1E0810', mid: '#E11D48', to: '#2A0C16', accent: '#FDA4AF', soft: '#FB7185' },
  Mathematics: { from: '#041525', mid: '#0284C7', to: '#0A2238', accent: '#7DD3FC', soft: '#38BDF8' },
  Art: { from: '#1E0E06', mid: '#EA580C', to: '#2A1408', accent: '#FDBA74', soft: '#FB923C' },
  Music: { from: '#16081F', mid: '#9333EA', to: '#220F30', accent: '#D8B4FE', soft: '#C084FC' },
  Medicine: { from: '#1E0808', mid: '#DC2626', to: '#2A0C0C', accent: '#FCA5A5', soft: '#F87171' },
  Wildlife: { from: '#101805', mid: '#65A30D', to: '#1A2608', accent: '#BEF264', soft: '#A3E635' },
  Geography: { from: '#041820', mid: '#0E7490', to: '#0A2530', accent: '#67E8F9', soft: '#22D3EE' },
};

const LAYOUT_BY_CATEGORY: Record<Category, ShareLayout> = {
  Technology: 'split',
  Space: 'orbit',
  AI: 'poster',
  History: 'editorial',
  Psychology: 'orbit',
  Philosophy: 'editorial',
  Science: 'classic',
  Nature: 'classic',
  Business: 'split',
  Finance: 'split',
  Design: 'poster',
  Mathematics: 'classic',
  Art: 'poster',
  Music: 'orbit',
  Medicine: 'editorial',
  Wildlife: 'classic',
  Geography: 'orbit',
};

const LAYOUT_META: Record<
  ShareLayout,
  {
    gradientStart: { x: number; y: number };
    gradientEnd: { x: number; y: number };
    titleAlign: 'left' | 'center';
    titleSize: number;
    bodyLines: number;
  }
> = {
  classic: {
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    titleAlign: 'left',
    titleSize: 26,
    bodyLines: 8,
  },
  orbit: {
    gradientStart: { x: 0.2, y: 0 },
    gradientEnd: { x: 0.9, y: 1 },
    titleAlign: 'left',
    titleSize: 25,
    bodyLines: 7,
  },
  editorial: {
    gradientStart: { x: 0, y: 1 },
    gradientEnd: { x: 1, y: 0 },
    titleAlign: 'left',
    titleSize: 28,
    bodyLines: 7,
  },
  split: {
    gradientStart: { x: 0, y: 0.5 },
    gradientEnd: { x: 1, y: 0.5 },
    titleAlign: 'left',
    titleSize: 24,
    bodyLines: 7,
  },
  poster: {
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    titleAlign: 'center',
    titleSize: 27,
    bodyLines: 6,
  },
};

interface CurioShareCardProps {
  curio: Curio;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function CurioShareCard({ curio }: CurioShareCardProps) {
  const category = (curio.category in SHARE_PALETTES
    ? curio.category
    : 'Technology') as Category;
  const palette = SHARE_PALETTES[category];
  const layout = LAYOUT_BY_CATEGORY[category];
  const meta = LAYOUT_META[layout];
  const icon = CATEGORY_ICONS[category] as keyof typeof Ionicons.glyphMap;
  const flip = hashSeed(curio.id) % 2 === 1;

  return (
    <View style={[styles.root, { backgroundColor: palette.from }]}>
      <LinearGradient
        colors={
          flip
            ? [palette.to, palette.mid, palette.from]
            : [palette.from, palette.mid, palette.to]
        }
        start={meta.gradientStart}
        end={meta.gradientEnd}
        style={StyleSheet.absoluteFill}
      />

      <Decor
        layout={layout}
        accent={palette.accent}
        soft={palette.soft}
        flip={flip}
      />

      {layout === 'split' ? (
        <SplitChrome
          curio={curio}
          palette={palette}
          icon={icon}
          titleSize={meta.titleSize}
          bodyLines={meta.bodyLines}
        />
      ) : layout === 'poster' ? (
        <PosterChrome
          curio={curio}
          palette={palette}
          icon={icon}
          titleSize={meta.titleSize}
          bodyLines={meta.bodyLines}
        />
      ) : layout === 'editorial' ? (
        <EditorialChrome
          curio={curio}
          palette={palette}
          icon={icon}
          titleSize={meta.titleSize}
          bodyLines={meta.bodyLines}
        />
      ) : layout === 'orbit' ? (
        <OrbitChrome
          curio={curio}
          palette={palette}
          icon={icon}
          titleSize={meta.titleSize}
          bodyLines={meta.bodyLines}
        />
      ) : (
        <ClassicChrome
          curio={curio}
          palette={palette}
          icon={icon}
          titleSize={meta.titleSize}
          bodyLines={meta.bodyLines}
          titleAlign={meta.titleAlign}
        />
      )}
    </View>
  );
}

function Decor({
  layout,
  accent,
  soft,
  flip,
}: {
  layout: ShareLayout;
  accent: string;
  soft: string;
  flip: boolean;
}) {
  if (layout === 'orbit') {
    return (
      <>
        <View
          style={[
            styles.orb,
            flip ? styles.orbOrbitLargeFlip : styles.orbOrbitLarge,
            { backgroundColor: accent },
          ]}
        />
        <View
          style={[
            styles.orb,
            flip ? styles.orbOrbitSmallFlip : styles.orbOrbitSmall,
            { backgroundColor: soft },
          ]}
        />
        <View
          style={[
            styles.ring,
            flip ? styles.ringFlip : null,
            { borderColor: accent },
          ]}
        />
      </>
    );
  }

  if (layout === 'editorial') {
    return (
      <>
        <View style={[styles.bar, styles.barTop, { backgroundColor: accent }]} />
        <View
          style={[
            styles.bar,
            flip ? styles.barSideRight : styles.barSide,
            { backgroundColor: soft },
          ]}
        />
        <View
          style={[
            styles.orb,
            flip ? styles.orbEditorialFlip : styles.orbEditorial,
            { backgroundColor: accent },
          ]}
        />
      </>
    );
  }

  if (layout === 'split') {
    return (
      <>
        <View style={[styles.splitBand, { backgroundColor: accent }]} />
        <View
          style={[
            styles.orb,
            flip ? styles.orbSplitFlip : styles.orbSplit,
            { backgroundColor: soft },
          ]}
        />
      </>
    );
  }

  if (layout === 'poster') {
    return (
      <>
        <View
          style={[
            styles.orb,
            flip ? styles.orbPosterTopFlip : styles.orbPosterTop,
            { backgroundColor: accent },
          ]}
        />
        <View
          style={[
            styles.orb,
            flip ? styles.orbPosterBottomFlip : styles.orbPosterBottom,
            { backgroundColor: soft },
          ]}
        />
        <View style={[styles.posterFrame, { borderColor: accent }]} />
      </>
    );
  }

  return (
    <>
      <View
        style={[
          styles.orb,
          flip ? styles.orbClassicAFlip : styles.orbClassicA,
          { backgroundColor: accent },
        ]}
      />
      <View
        style={[
          styles.orb,
          flip ? styles.orbClassicBFlip : styles.orbClassicB,
          { backgroundColor: soft },
        ]}
      />
    </>
  );
}

function Wordmark({ accent }: { accent: string }) {
  return (
    <Text style={styles.wordmark}>
      Curri<Text style={{ color: accent }}>o</Text>
    </Text>
  );
}

function CategoryPill({
  label,
  icon,
  accent,
  align = 'flex-start',
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  align?: 'flex-start' | 'center';
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          alignSelf: align,
          backgroundColor: `${accent}22`,
          borderColor: `${accent}66`,
        },
      ]}
    >
      <Ionicons name={icon} size={13} color={accent} />
      <Text style={[styles.pillText, { color: accent }]}>{label}</Text>
    </View>
  );
}

function Footer({
  accent,
  hint = 'Learn something new every day',
  centered = false,
}: {
  accent: string;
  hint?: string;
  centered?: boolean;
}) {
  return (
    <View
      style={[
        styles.footer,
        centered && styles.footerCentered,
        { borderTopColor: `${accent}44` },
      ]}
    >
      <Text style={[styles.footerHint, { color: `${accent}CC` }]}>{hint}</Text>
      {!centered ? (
        <Text style={[styles.footerBrand, { color: BRAND.mist }]}>currio</Text>
      ) : null}
    </View>
  );
}

function ClassicChrome({
  curio,
  palette,
  icon,
  titleSize,
  bodyLines,
  titleAlign,
}: {
  curio: Curio;
  palette: SharePalette;
  icon: keyof typeof Ionicons.glyphMap;
  titleSize: number;
  bodyLines: number;
  titleAlign: 'left' | 'center';
}) {
  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Wordmark accent={palette.accent} />
        <Text style={[styles.kicker, { color: palette.accent }]}>Curiosity, distilled</Text>
      </View>
      <CategoryPill label={curio.category} icon={icon} accent={palette.accent} />
      <Text
        style={[
          styles.title,
          {
            color: BRAND.mist,
            fontSize: titleSize,
            lineHeight: titleSize + 6,
            textAlign: titleAlign,
          },
        ]}
        numberOfLines={3}
      >
        {curio.title}
      </Text>
      <Text style={[styles.body, { color: palette.soft }]} numberOfLines={bodyLines}>
        {curio.content}
      </Text>
      <Footer accent={palette.accent} />
    </View>
  );
}

function OrbitChrome({
  curio,
  palette,
  icon,
  titleSize,
  bodyLines,
}: {
  curio: Curio;
  palette: SharePalette;
  icon: keyof typeof Ionicons.glyphMap;
  titleSize: number;
  bodyLines: number;
}) {
  return (
    <View style={[styles.content, styles.contentOrbit]}>
      <View style={styles.headerRow}>
        <Wordmark accent={palette.accent} />
        <View style={[styles.iconBadge, { borderColor: palette.accent }]}>
          <Ionicons name={icon} size={18} color={palette.accent} />
        </View>
      </View>
      <Text style={[styles.kicker, { color: palette.accent, marginBottom: 14 }]}>
        {curio.category.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.title,
          { color: BRAND.mist, fontSize: titleSize, lineHeight: titleSize + 6 },
        ]}
        numberOfLines={3}
      >
        {curio.title}
      </Text>
      <View style={[styles.quoteRail, { backgroundColor: palette.accent }]} />
      <Text style={[styles.body, { color: palette.soft }]} numberOfLines={bodyLines}>
        {curio.content}
      </Text>
      <Footer accent={palette.accent} hint="A tiny orbit of wonder" />
    </View>
  );
}

function EditorialChrome({
  curio,
  palette,
  icon,
  titleSize,
  bodyLines,
}: {
  curio: Curio;
  palette: SharePalette;
  icon: keyof typeof Ionicons.glyphMap;
  titleSize: number;
  bodyLines: number;
}) {
  return (
    <View style={[styles.content, styles.contentEditorial]}>
      <CategoryPill label={curio.category} icon={icon} accent={palette.accent} />
      <Text
        style={[
          styles.title,
          {
            color: BRAND.mist,
            fontSize: titleSize,
            lineHeight: titleSize + 8,
            marginTop: 18,
            letterSpacing: -0.8,
          },
        ]}
        numberOfLines={4}
      >
        {curio.title}
      </Text>
      <Text
        style={[styles.body, styles.bodyEditorial, { color: palette.soft }]}
        numberOfLines={bodyLines}
      >
        {curio.content}
      </Text>
      <View style={styles.editorialFooter}>
        <Wordmark accent={palette.accent} />
        <Text style={[styles.kicker, { color: palette.accent }]}>Curiosity, distilled</Text>
      </View>
    </View>
  );
}

function SplitChrome({
  curio,
  palette,
  icon,
  titleSize,
  bodyLines,
}: {
  curio: Curio;
  palette: SharePalette;
  icon: keyof typeof Ionicons.glyphMap;
  titleSize: number;
  bodyLines: number;
}) {
  return (
    <View style={styles.content}>
      <View style={styles.splitTop}>
        <Text style={[styles.wordmark, { color: palette.from }]}>
          Curri<Text style={{ color: palette.to }}>o</Text>
        </Text>
        <View
          style={[
            styles.pill,
            {
              alignSelf: 'flex-start',
              backgroundColor: `${palette.from}18`,
              borderColor: `${palette.from}44`,
            },
          ]}
        >
          <Ionicons name={icon} size={13} color={palette.from} />
          <Text style={[styles.pillText, { color: palette.from }]}>{curio.category}</Text>
        </View>
      </View>
      <View style={styles.splitBottom}>
        <Text
          style={[
            styles.title,
            { color: BRAND.mist, fontSize: titleSize, lineHeight: titleSize + 6 },
          ]}
          numberOfLines={3}
        >
          {curio.title}
        </Text>
        <Text style={[styles.body, { color: palette.soft }]} numberOfLines={bodyLines}>
          {curio.content}
        </Text>
        <Footer accent={palette.accent} />
      </View>
    </View>
  );
}

function PosterChrome({
  curio,
  palette,
  icon,
  titleSize,
  bodyLines,
}: {
  curio: Curio;
  palette: SharePalette;
  icon: keyof typeof Ionicons.glyphMap;
  titleSize: number;
  bodyLines: number;
}) {
  return (
    <View style={[styles.content, styles.contentPoster]}>
      <Wordmark accent={palette.accent} />
      <View style={styles.posterCenter}>
        <View style={[styles.posterIconWrap, { backgroundColor: `${palette.accent}24` }]}>
          <Ionicons name={icon} size={28} color={palette.accent} />
        </View>
        <CategoryPill
          label={curio.category}
          icon={icon}
          accent={palette.accent}
          align="center"
        />
        <Text
          style={[
            styles.title,
            {
              color: BRAND.mist,
              fontSize: titleSize,
              lineHeight: titleSize + 6,
              textAlign: 'center',
              marginTop: 10,
            },
          ]}
          numberOfLines={3}
        >
          {curio.title}
        </Text>
        <Text
          style={[styles.body, { color: palette.soft, textAlign: 'center' }]}
          numberOfLines={bodyLines}
        >
          {curio.content}
        </Text>
      </View>
      <Footer accent={palette.accent} hint="Save · Share · Stay curious" centered />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: CURIO_SHARE_CARD_WIDTH,
    height: CURIO_SHARE_CARD_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  contentOrbit: {
    paddingTop: 32,
  },
  contentEditorial: {
    paddingTop: 36,
  },
  contentPoster: {
    alignItems: 'center',
    paddingTop: 26,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.22,
  },
  orbClassicA: {
    width: 220,
    height: 220,
    top: -70,
    right: -50,
  },
  orbClassicAFlip: {
    width: 220,
    height: 220,
    top: -70,
    left: -50,
  },
  orbClassicB: {
    width: 140,
    height: 140,
    bottom: 40,
    left: -50,
    opacity: 0.16,
  },
  orbClassicBFlip: {
    width: 140,
    height: 140,
    bottom: 40,
    right: -50,
    opacity: 0.16,
  },
  orbOrbitLarge: {
    width: 260,
    height: 260,
    top: -90,
    left: -80,
  },
  orbOrbitLargeFlip: {
    width: 260,
    height: 260,
    top: -90,
    right: -80,
  },
  orbOrbitSmall: {
    width: 120,
    height: 120,
    bottom: 70,
    right: -30,
    opacity: 0.18,
  },
  orbOrbitSmallFlip: {
    width: 120,
    height: 120,
    bottom: 70,
    left: -30,
    opacity: 0.18,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 2,
    top: 120,
    right: -60,
    opacity: 0.28,
  },
  ringFlip: {
    left: -60,
    right: undefined,
  },
  bar: {
    position: 'absolute',
    opacity: 0.9,
  },
  barTop: {
    left: 0,
    right: 0,
    top: 0,
    height: 8,
  },
  barSide: {
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    opacity: 0.55,
  },
  barSideRight: {
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    opacity: 0.55,
  },
  orbEditorial: {
    width: 180,
    height: 180,
    bottom: -40,
    right: -40,
    opacity: 0.16,
  },
  orbEditorialFlip: {
    width: 180,
    height: 180,
    bottom: -40,
    left: -40,
    opacity: 0.16,
  },
  splitBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 118,
    opacity: 0.92,
  },
  orbSplit: {
    width: 160,
    height: 160,
    bottom: -30,
    right: -20,
    opacity: 0.14,
  },
  orbSplitFlip: {
    width: 160,
    height: 160,
    bottom: -30,
    left: -20,
    opacity: 0.14,
  },
  orbPosterTop: {
    width: 200,
    height: 200,
    top: -80,
    left: -40,
  },
  orbPosterTopFlip: {
    width: 200,
    height: 200,
    top: -80,
    right: -40,
  },
  orbPosterBottom: {
    width: 170,
    height: 170,
    bottom: -50,
    right: -40,
    opacity: 0.16,
  },
  orbPosterBottomFlip: {
    width: 170,
    height: 170,
    bottom: -50,
    left: -40,
    opacity: 0.16,
  },
  posterFrame: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 1.5,
    borderRadius: 28,
    opacity: 0.35,
  },
  header: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: BRAND.mist,
  },
  kicker: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  body: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
  bodyEditorial: {
    marginTop: 4,
  },
  quoteRail: {
    width: 4,
    height: 36,
    borderRadius: 4,
    marginBottom: 12,
    opacity: 0.9,
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerCentered: {
    justifyContent: 'center',
    width: '100%',
  },
  footerHint: {
    flex: 1,
    fontSize: 12,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  splitTop: {
    height: 90,
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  splitBottom: {
    flex: 1,
    paddingTop: 18,
  },
  posterCenter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  posterIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  editorialFooter: {
    marginTop: 12,
  },
});
