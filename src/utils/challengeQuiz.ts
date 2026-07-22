import { getCuriosByCategories } from '@/services/curioService';
import type { Curio } from '@/types/curio';

export type ChallengeChoice = {
  id: string;
  text: string;
};

export type ChallengeQuiz = {
  curioId: string;
  category: string;
  question: string;
  choices: ChallengeChoice[];
  correctChoiceId: string;
};

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

function choiceText(content: string): string {
  return content.trim();
}

function uniqueById(curios: Curio[]): Curio[] {
  const seen = new Set<string>();
  const out: Curio[] = [];
  for (const curio of curios) {
    if (seen.has(curio.id)) continue;
    seen.add(curio.id);
    out.push(curio);
  }
  return out;
}

/**
 * Builds a soft MCQ from curios the user opened this session.
 * Correct answer is drawn from one session curio; distractors prefer
 * other session curios, then same-category catalog fillers.
 * Choice text is the full curio content (never truncated).
 */
export function buildChallengeQuizFromSession(
  sessionCurios: Curio[],
): ChallengeQuiz | null {
  const opened = uniqueById(sessionCurios);
  if (opened.length === 0) return null;

  const source = opened[Math.floor(Math.random() * opened.length)]!;
  const sessionOthers = opened.filter((item) => item.id !== source.id);

  const categoryPool = getCuriosByCategories([source.category]).filter(
    (item) => item.id !== source.id && !sessionOthers.some((s) => s.id === item.id),
  );

  const distractorSources = shuffle([
    ...sessionOthers,
    ...shuffle(categoryPool),
  ]).slice(0, 3);

  if (distractorSources.length < 2) return null;

  const correctChoiceId = `c-${source.id}`;
  const choices = shuffle([
    {
      id: correctChoiceId,
      text: choiceText(source.content),
    },
    ...distractorSources.map((item) => ({
      id: `d-${item.id}`,
      text: choiceText(item.content),
    })),
  ]);

  const templates =
    opened.length >= 2
      ? [
          'Only one of these is true. Which is it?',
          'Three decoys, one real fact — pick the true one.',
          'Which fact is correct? The rest are wrong.',
        ]
      : [
          'Only one answer is right. Which fact is true?',
          'Pick the true fact — the others are decoys.',
        ];

  return {
    curioId: source.id,
    category: source.category,
    question: templates[Math.floor(Math.random() * templates.length)]!,
    choices,
    correctChoiceId,
  };
}

/** @deprecated Prefer buildChallengeQuizFromSession */
export function buildChallengeQuiz(curio: Curio): ChallengeQuiz | null {
  return buildChallengeQuizFromSession([curio]);
}
