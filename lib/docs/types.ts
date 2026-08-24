export type PropDoc = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentDocMeta = {
  anatomy: string[];
  states: string[];
  rationale: string;
  usage: string | string[];
  props: PropDoc[];
  functions?: PropDoc[];
  types?: PropDoc[];
  returns?: PropDoc[];
};

export function apiHookMeta(
  usage: string,
  props: PropDoc[],
): ComponentDocMeta {
  return {
    anatomy: ["Normalized request", "Replaceable adapter", "Resource state"],
    states: ["Idle", "Loading", "Success", "Error", "Refreshing"],
    rationale:
      "Keeps provider credentials and response differences behind a stable client contract while preserving honest configuration and provider failures.",
    usage,
    props,
    returns: [
      {
        name: "resource",
        type: "{ status, data, error, updatedAt, refetch }",
        defaultValue: "—",
        description:
          "Normalized resource state plus explicit status flags and a manual refresh action.",
      },
    ],
  };
}

export function compositionMeta(
  usage: string,
  props: PropDoc[],
): ComponentDocMeta {
  return {
    anatomy: ["Context", "Primary task", "Status and recovery"],
    states: ["Ready", "Loading", "Success", "Error", "Disconnected"],
    rationale:
      "Composes registry primitives into a complete task while leaving provider and wallet execution explicit.",
    usage,
    props,
  };
}
