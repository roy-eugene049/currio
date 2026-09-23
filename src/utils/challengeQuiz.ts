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

const MIN_DISTRACTORS = 2;
const TARGET_DISTRACTORS = 3;

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

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Change integers / years enough that the claim is no longer the original fact. */
function mutateNumbers(text: string): string | null {
  const matches = [...text.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)];
  if (matches.length === 0) return null;

  let changed = false;
  let index = 0;
  const next = text.replace(/\b\d[\d,]*(?:\.\d+)?\b/g, (raw) => {
    const current = index;
    index += 1;
    // Stagger which number we mutate so variants differ.
    if (current % 2 !== 0 && matches.length > 1) return raw;

    const plain = raw.replace(/,/g, '');
    const value = Number(plain);
    if (!Number.isFinite(value)) return raw;

    let mutated: number;
    if (Number.isInteger(value) && plain.length === 4 && value >= 1400 && value <= 2090) {
      mutated = value + (value % 2 === 0 ? 17 : -23);
    } else if (value === 0) {
      mutated = 12;
    } else if (Math.abs(value) < 1) {
      mutated = value === 0.5 ? 0.9 : value * 3;
    } else {
      const bump = Math.max(1, Math.round(Math.abs(value) * 0.45));
      mutated = value > 0 ? value + bump : value - bump;
    }

    changed = true;
    if (raw.includes(',')) {
      return Math.round(mutated).toLocaleString('en-US');
    }
    if (raw.includes('.')) return String(mutated);
    return String(Math.round(mutated));
  });

  return changed && normalize(next) !== normalize(text) ? next : null;
}

/** Flip or insert negation so the statement contradicts the original. */
function mutateNegation(text: string): string | null {
  if (/\bnot\b/i.test(text)) {
    const next = text.replace(/\bnot\s+/i, '');
    return normalize(next) !== normalize(text) ? next : null;
  }

  const withAux = text.replace(
    /\b(is|are|was|were|can|could|does|do|did|has|have|had|will|would)\b/i,
    '$1 not',
  );
  if (normalize(withAux) !== normalize(text)) return withAux;

  const withNever = text.replace(/\b(always|often|usually|typically)\b/i, 'never');
  if (normalize(withNever) !== normalize(text)) return withNever;

  return null;
}

/** Swap directional / comparative language that reverses the claim. */
function mutatePolarity(text: string): string | null {
  const pairs: [RegExp, string][] = [
    [/\balways\b/i, 'never'],
    [/\bnever\b/i, 'always'],
    [/\bmore\b/i, 'less'],
    [/\bless\b/i, 'more'],
    [/\blarger\b/i, 'smaller'],
    [/\bsmaller\b/i, 'larger'],
    [/\bhigher\b/i, 'lower'],
    [/\blower\b/i, 'higher'],
    [/\bfaster\b/i, 'slower'],
    [/\bslower\b/i, 'faster'],
    [/\bincrease(?:s|d)?\b/i, 'decrease'],
    [/\bdecrease(?:s|d)?\b/i, 'increase'],
    [/\bbefore\b/i, 'after'],
    [/\bafter\b/i, 'before'],
    [/\boldest\b/i, 'newest'],
    [/\bnewest\b/i, 'oldest'],
    [/\bfirst\b/i, 'last'],
    [/\blast\b/i, 'first'],
    [/\btrue\b/i, 'false'],
    [/\bfalse\b/i, 'true'],
    [/\bpositive\b/i, 'negative'],
    [/\bnegative\b/i, 'positive'],
  ];

  for (const [pattern, replacement] of pairs) {
    if (!pattern.test(text)) continue;
    const next = text.replace(pattern, replacement);
    if (normalize(next) !== normalize(text)) return next;
  }
  return null;
}

/**
 * Last-resort false claim: clearly inverted framing that cannot be
 * mistaken for the original catalog fact.
 */
function mutateFraming(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 24) return null;

  const next = trimmed.replace(
    /^(It is|It's|This is|Scientists|Researchers|People|Most|Many|The)\b/i,
    'It is a myth that',
  );
  if (normalize(next) !== normalize(trimmed) && next.startsWith('It is a myth')) {
    return next;
  }

  return `It is false that ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`.replace(
    /\.\s*$/,
    '.',
  );
}

/**
 * Build false statements derived from a true curio.
 * Never returns the original text. Never uses other curios.
 */
export function buildFalseDistractors(
  trueContent: string,
  count: number = TARGET_DISTRACTORS,
): string[] {
  const trueNorm = normalize(trueContent);
  const generators = [
    () => mutateNumbers(trueContent),
    () => mutateNegation(trueContent),
    () => mutatePolarity(trueContent),
    () => mutateFraming(trueContent),
    // Second-pass number mutation after polarity (different shape)
    () => {
      const polar = mutatePolarity(trueContent);
      return polar ? mutateNumbers(polar) : null;
    },
    () => {
      const negated = mutateNegation(trueContent);
      return negated ? mutateNumbers(negated) : null;
    },
  ];

  const out: string[] = [];
  const seen = new Set<string>([trueNorm]);

  for (const generate of generators) {
    if (out.length >= count) break;
    const candidate = generate();
    if (!candidate) continue;
    const norm = normalize(candidate);
    if (seen.has(norm)) continue;
    // Reject near-identical strings (tiny edits that keep meaning)
    if (norm.length < 12) continue;
    seen.add(norm);
    out.push(candidate.trim());
  }

  return out.slice(0, count);
}

/**
 * Builds a truth MCQ from a curio the user opened.
 * Correct = exact catalog fact. Distractors = generated false statements
 * derived from that fact — never other real curios.
 */
export function buildChallengeQuizFromSession(
  sessionCurios: Curio[],
): ChallengeQuiz | null {
  const opened = uniqueById(sessionCurios);
  if (opened.length === 0) return null;

  const source = opened[Math.floor(Math.random() * opened.length)]!;
  const trueText = normalize(source.content);
  if (trueText.length < 12) return null;

  const falseTexts = buildFalseDistractors(trueText, TARGET_DISTRACTORS);
  if (falseTexts.length < MIN_DISTRACTORS) return null;

  // Hard guard: no distractor may equal the true fact.
  const safeDistractors = falseTexts.filter(
    (text) => normalize(text) !== trueText,
  );
  if (safeDistractors.length < MIN_DISTRACTORS) return null;

  const correctChoiceId = `c-${source.id}`;
  const choices = shuffle([
    { id: correctChoiceId, text: trueText },
    ...safeDistractors.map((text, index) => ({
      id: `f-${source.id}-${index}`,
      text,
    })),
  ]);

  // Final integrity check before shipping the quiz to UI.
  const correct = choices.find((c) => c.id === correctChoiceId);
  if (!correct || normalize(correct.text) !== trueText) return null;
  if (
    choices.some(
      (c) => c.id !== correctChoiceId && normalize(c.text) === trueText,
    )
  ) {
    return null;
  }

  const templates = [
    'Only one statement is true. Which one?',
    'One fact is real — the others were altered to be false. Pick the true one.',
    'Which of these is actually true?',
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
