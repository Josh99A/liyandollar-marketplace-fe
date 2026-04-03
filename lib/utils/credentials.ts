import type { CredentialsRecord } from "@/types";

function isCredentialsRecord(value: unknown): value is CredentialsRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCredentialsCollection(
  value: CredentialsRecord | CredentialsRecord[] | null | undefined,
) {
  if (!value) {
    return [] as CredentialsRecord[];
  }

  if (Array.isArray(value)) {
    return value.filter(isCredentialsRecord);
  }

  return isCredentialsRecord(value) ? [value] : [];
}
