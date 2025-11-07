const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const buildSafetyNotes = (candidates: Array<string | undefined | null>): string[] => {
  return Array.from(
    new Set(
      candidates
        .filter(isNonEmptyString)
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate.length > 0),
    ),
  );
};
