import { useMutation } from '@tanstack/react-query';

import { checkDrugInteractions } from '@/features/charts/api/orca-api';
import type { DrugInteractionEntry } from '@/features/charts/types/orca';

interface InteractionVariables {
  existingCodes: string[];
  candidateCodes: string[];
}

export const useInteractionCheck = () =>
  useMutation<DrugInteractionEntry[], Error, InteractionVariables>({
    mutationFn: async ({ existingCodes, candidateCodes }) =>
      checkDrugInteractions(candidateCodes, existingCodes),
  });
