import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChallengeConfetti,
  ChallengeSoftMiss,
} from '@/components/challenge/ChallengeFeedback';
import {
  markChallengeOffered,
  recordChallengeWin,
} from '@/services/challengeService';
import { useChallengeSheetStore } from '@/store/useChallengeSheetStore';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/theme/brand';
import { showActionFeedback } from '@/utils/actionFeedback';

type Phase = 'prompt' | 'result';

const GREEN = '#22C55E';
const GREEN_INK = '#166534';
const RED = '#EF4444';
const RED_INK = '#B91C1C';

function ChoiceRow({
  label,
  index,
  isDark,
  onPress,
}: {
  label: string;
  index: number;
  isDark: boolean;
  onPress: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  const ink = isDark ? BRAND.mist : '#1A0038';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.choiceRow,
        {
          backgroundColor: isDark ? BRAND.deepMuted : '#FFFFFF',
          borderColor: isDark
            ? 'rgba(225, 176, 255, 0.28)'
            : 'rgba(111, 0, 255, 0.16)',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.choiceInner}>
        <LinearGradient
          colors={[BRAND.electric, BRAND.pale]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.choiceBadge}
        >
          <Text style={styles.choiceBadgeText}>{letter}</Text>
        </LinearGradient>
        <View style={styles.choiceLabelWrap}>
          <Text style={[styles.choiceLabel, { color: ink }]}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function AnswerCard({
  label,
  text,
  tone,
  isDark,
  delay = 0,
}: {
  label: string;
  text: string;
  tone: 'correct' | 'incorrect';
  isDark: boolean;
  delay?: number;
}) {
  const accent = tone === 'correct' ? GREEN : RED;
  const accentInk = tone === 'correct' ? GREEN_INK : RED_INK;
  const icon = tone === 'correct' ? 'checkmark-circle' : 'close-circle';
  const ink = isDark ? BRAND.mist : '#1A0038';

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(320)}
      style={[
        styles.answerCard,
        {
          backgroundColor: isDark ? 'rgba(255,242,242,0.06)' : '#FFFFFF',
          borderColor: isDark
            ? 'rgba(225, 176, 255, 0.18)'
            : 'rgba(111, 0, 255, 0.1)',
        },
      ]}
    >
      <View style={[styles.answerRail, { backgroundColor: accent }]} />
      <View style={styles.answerCardBody}>
        <View style={styles.answerLabelRow}>
          <Ionicons name={icon} size={15} color={accent} />
          <Text style={[styles.answerLabel, { color: accentInk }]}>{label}</Text>
        </View>
        <Text style={[styles.answerText, { color: ink }]}>{text}</Text>
      </View>
    </Animated.View>
  );
}

export function ChallengeSheet() {
  const quiz = useChallengeSheetStore((s) => s.quiz);
  const closeChallenge = useChallengeSheetStore((s) => s.closeChallenge);
  const applyChallengeStreakBonus = useAppStore((s) => s.applyChallengeStreakBonus);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('prompt');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [wins, setWins] = useState<number | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);

  const visible = Boolean(quiz);

  useEffect(() => {
    if (!quiz) {
      setPhase('prompt');
      setWasCorrect(false);
      setSelectedChoiceId(null);
      setWins(null);
      setFeedbackKey(0);
    }
  }, [quiz]);

  const finish = async (correct: boolean) => {
    await markChallengeOffered();
    if (correct) {
      const total = await recordChallengeWin();
      setWins(total);
      const bonus = await applyChallengeStreakBonus();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showActionFeedback(
        'success',
        bonus
          ? 'Correct — soft streak bonus +1'
          : 'Correct — spark earned',
      );
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showActionFeedback('error', 'Incorrect — no streak cost');
    }
  };

  const handleSelect = async (choiceId: string) => {
    if (!quiz || phase !== 'prompt') return;
    const correct = choiceId === quiz.correctChoiceId;
    void Haptics.selectionAsync();
    setSelectedChoiceId(choiceId);
    setWasCorrect(correct);
    setFeedbackKey((key) => key + 1);
    setPhase('result');
    await finish(correct);
  };

  const handleSkip = async () => {
    await markChallengeOffered();
    void Haptics.selectionAsync();
    closeChallenge();
  };

  const handleDone = () => {
    closeChallenge();
  };

  if (!quiz) return null;

  const ink = isDark ? BRAND.mist : '#1A0038';
  const muted = isDark ? 'rgba(255,242,242,0.7)' : '#6B3F96';
  const showFeedback = phase === 'result';
  const selectedChoiceText =
    quiz.choices.find((c) => c.id === selectedChoiceId)?.text ?? '';
  const correctChoiceText =
    quiz.choices.find((c) => c.id === quiz.correctChoiceId)?.text ?? '';

  const sheetBg = isDark ? BRAND.deep : '#F8F3FF';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={phase === 'prompt' ? handleSkip : handleDone}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={phase === 'prompt' ? handleSkip : handleDone}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              paddingBottom: Math.max(insets.bottom, 12) + 10,
            },
          ]}
        >
          {showFeedback && wasCorrect ? (
            <ChallengeConfetti key={`win-${feedbackKey}`} active />
          ) : null}
          {showFeedback && !wasCorrect ? (
            <ChallengeSoftMiss key={`miss-${feedbackKey}`} active />
          ) : null}

          <LinearGradient
            colors={
              showFeedback
                ? wasCorrect
                  ? [BRAND.deep, '#245C3A', BRAND.electric]
                  : [BRAND.deep, '#5C2434', BRAND.electric]
                : [BRAND.deep, BRAND.electric, '#8B4DFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <View style={styles.heroOrb} />

            <View style={styles.handle} />

            {showFeedback ? (
              <Animated.View
                entering={ZoomIn.springify().damping(16)}
                style={styles.heroResult}
              >
                <View
                  style={[
                    styles.statusOrb,
                    {
                      borderColor: wasCorrect
                        ? 'rgba(74, 222, 128, 0.65)'
                        : 'rgba(248, 113, 113, 0.6)',
                      backgroundColor: wasCorrect
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(239, 68, 68, 0.18)',
                    },
                  ]}
                >
                  <Ionicons
                    name={wasCorrect ? 'checkmark' : 'close'}
                    size={32}
                    color={BRAND.mist}
                  />
                </View>
                <Text style={styles.heroKicker}>
                  {wasCorrect ? 'Correct' : 'Incorrect'}
                </Text>
                <Text style={[styles.heroTitle, styles.centered]}>
                  {wasCorrect
                    ? wins != null
                      ? `${wins} spark${wins === 1 ? '' : 's'} earned`
                      : 'You nailed it'
                    : 'Keep exploring'}
                </Text>
                <Text style={[styles.heroSubtitle, styles.centered]}>
                  {wasCorrect
                    ? 'That fact stuck — nice work.'
                    : 'No streak lost. Here’s what to remember.'}
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.heroPrompt}>
                <View style={styles.heroTopRow}>
                  <View style={styles.pill}>
                    <Ionicons name="sparkles" size={11} color={BRAND.mist} />
                    <Text style={styles.pillText}>Optional quiz</Text>
                  </View>
                  {quiz.category ? (
                    <View style={[styles.pill, styles.pillQuiet]}>
                      <Text style={styles.pillText} numberOfLines={1}>
                        {quiz.category}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.heroTitle}>Curiosity quiz</Text>
                <Text style={styles.heroSubtitle}>
                  One statement is true. The rest were altered. Skip anytime.
                </Text>
              </View>
            )}
          </LinearGradient>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            bounces
          >
            {phase === 'prompt' ? (
              <>
                <Animated.View
                  entering={FadeIn.duration(280)}
                  style={[
                    styles.questionCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 242, 242, 0.07)'
                        : BRAND.mint,
                      borderColor: isDark
                        ? 'rgba(225, 176, 255, 0.22)'
                        : 'rgba(111, 0, 255, 0.14)',
                    },
                  ]}
                >
                  <View style={styles.questionMeta}>
                    <View
                      style={[
                        styles.questionIcon,
                        {
                          backgroundColor: isDark
                            ? 'rgba(111, 0, 255, 0.35)'
                            : 'rgba(111, 0, 255, 0.12)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="help-circle"
                        size={16}
                        color={isDark ? BRAND.lavender : BRAND.electric}
                      />
                    </View>
                    <Text
                      style={[styles.sectionLabel, { color: BRAND.electric }]}
                    >
                      Question
                    </Text>
                  </View>
                  <Text style={[styles.question, { color: ink }]}>
                    {quiz.question}
                  </Text>
                </Animated.View>

                <View style={styles.choices}>
                  {quiz.choices.map((choice, index) => (
                    <Animated.View
                      key={choice.id}
                      entering={FadeInDown.delay(40 + 45 * index).duration(280)}
                    >
                      {index > 0 ? (
                        <View style={styles.choiceSeparator}>
                          <View
                            style={[
                              styles.choiceSeparatorLine,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(225, 176, 255, 0.28)'
                                  : 'rgba(111, 0, 255, 0.16)',
                              },
                            ]}
                          />
                        </View>
                      ) : null}
                      <ChoiceRow
                        label={choice.text}
                        index={index}
                        isDark={isDark}
                        onPress={() => void handleSelect(choice.id)}
                      />
                    </Animated.View>
                  ))}
                </View>

                <Pressable
                  onPress={() => void handleSkip()}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.skipButton,
                    {
                      borderColor: isDark
                        ? 'rgba(225, 176, 255, 0.32)'
                        : 'rgba(111, 0, 255, 0.2)',
                      backgroundColor: isDark
                        ? 'rgba(255, 242, 242, 0.06)'
                        : 'rgba(111, 0, 255, 0.05)',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="play-skip-forward-outline"
                    size={15}
                    color={muted}
                  />
                  <Text style={[styles.skipText, { color: muted }]}>
                    Skip this quiz
                  </Text>
                </Pressable>
              </>
            ) : (
              <Animated.View entering={FadeIn.duration(260)} style={styles.result}>
                <Text style={[styles.sectionLabel, { color: BRAND.electric }]}>
                  {wasCorrect ? 'The fact that stuck' : 'Compare answers'}
                </Text>

                {wasCorrect ? (
                  <AnswerCard
                    label="Your answer"
                    text={correctChoiceText}
                    tone="correct"
                    isDark={isDark}
                    delay={70}
                  />
                ) : (
                  <View style={styles.answerCompare}>
                    <AnswerCard
                      label="Your answer"
                      text={selectedChoiceText}
                      tone="incorrect"
                      isDark={isDark}
                      delay={50}
                    />
                    <AnswerCard
                      label="Correct answer"
                      text={correctChoiceText}
                      tone="correct"
                      isDark={isDark}
                      delay={120}
                    />
                  </View>
                )}

                <Pressable
                  onPress={handleDone}
                  accessibilityRole="button"
                  style={styles.primaryWrap}
                >
                  <LinearGradient
                    colors={[BRAND.electric, BRAND.pale]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Back to curios</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={BRAND.mist}
                    />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 0, 20, 0.55)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 242, 242, 0.35)',
  },
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    paddingTop: 12,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 242, 242, 0.08)',
    top: -90,
    right: -60,
  },
  heroOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(225, 176, 255, 0.16)',
    bottom: -36,
    left: -20,
  },
  heroPrompt: {
    gap: 6,
  },
  heroResult: {
    alignItems: 'center',
    paddingBottom: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 242, 242, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 242, 242, 0.2)',
  },
  pillQuiet: {
    backgroundColor: 'rgba(10, 0, 24, 0.2)',
    borderColor: 'rgba(255, 242, 242, 0.12)',
    maxWidth: '55%',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.mist,
    letterSpacing: 0.2,
  },
  heroKicker: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255, 242, 242, 0.78)',
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -0.55,
    lineHeight: 30,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 242, 242, 0.86)',
    maxWidth: 300,
  },
  centered: {
    textAlign: 'center',
    alignSelf: 'center',
  },
  statusOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 14,
  },
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  questionIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 26,
  },
  choices: {
    marginTop: 2,
  },
  choiceSeparator: {
    height: 18,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  choiceSeparatorLine: {
    height: 1,
    width: '100%',
    borderRadius: 1,
  },
  choiceRow: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  choiceInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  choiceBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.mist,
  },
  choiceLabelWrap: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 8,
    paddingTop: 4,
  },
  choiceLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  skipButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  result: {
    gap: 12,
  },
  answerCompare: {
    gap: 10,
  },
  answerCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  answerRail: {
    width: 4,
  },
  answerCardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  answerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  primaryWrap: {
    marginTop: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.mist,
    letterSpacing: -0.2,
  },
});
