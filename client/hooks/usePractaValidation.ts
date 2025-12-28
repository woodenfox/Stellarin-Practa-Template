import { useMemo } from "react";
import MyPracta from "@/my-practa";
import practaMetadata from "@/my-practa/metadata.json";
import { validatePracta, ValidationReport } from "@/lib/practa-validator";

export function usePractaValidation(): ValidationReport {
  return useMemo(() => {
    return validatePracta(MyPracta, practaMetadata);
  }, []);
}

export { ValidationReport } from "@/lib/practa-validator";
