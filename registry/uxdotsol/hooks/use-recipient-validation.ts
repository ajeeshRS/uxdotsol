"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  address as parseAddress,
  createSolanaRpc,
  type Address,
  type Commitment,
} from "@solana/kit";

export type RecipientRpcConnection = {
  rpcEndpoint: string;
};

export type RecipientAddressInput = string | { toString(): string };

export type RecipientValidationStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "safe"
  | "warning"
  | "blocked"
  | "error";

export type RecipientValidationReasonCode =
  | "invalid-address"
  | "blocked-address"
  | "self-recipient"
  | "trusted-address"
  | "rpc-unavailable"
  | "account-not-found"
  | "executable-account"
  | "account-found"
  | "rpc-error";

export type RecipientValidationReason = {
  code: RecipientValidationReasonCode;
  severity: "info" | "warning" | "danger";
  message: string;
};

export type RecipientValidationOptions = {
  rpcEndpoint?: string;
  connection?: RecipientRpcConnection | null;
  sender?: RecipientAddressInput | null;
  enabled?: boolean;
  allowSelf?: boolean;
  requireExistingAccount?: boolean;
  blockExecutableAccounts?: boolean;
  blockedAddresses?: readonly string[];
  trustedAddresses?: readonly string[];
  commitment?: Commitment;
  debounceMs?: number;
};

export type RecipientValidationValue = {
  status: RecipientValidationStatus;
  address: string;
  normalizedAddress: string | null;
  accountExists: boolean | null;
  executable: boolean | null;
  owner: string | null;
  lamports: bigint | null;
  reasons: RecipientValidationReason[];
  error: Error | null;
  isValidAddress: boolean;
  isLoading: boolean;
  isSafe: boolean;
  canSubmit: boolean;
  refetch: () => void;
};

export type RecipientLocalValidationOptions = Pick<
  RecipientValidationOptions,
  "allowSelf" | "blockedAddresses" | "sender" | "trustedAddresses"
>;

export type RecipientLocalValidation = {
  address: string;
  normalizedAddress: string | null;
  parsedAddress: Address | null;
  reasons: RecipientValidationReason[];
  status: "idle" | "invalid" | "blocked" | "warning" | "safe";
};

function normalizeComparableAddress(
  value: RecipientAddressInput | null | undefined,
) {
  if (!value) return null;

  const rawValue = typeof value === "string" ? value : value.toString();
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) return null;

  try {
    return parseAddress(trimmedValue);
  } catch {
    return trimmedValue;
  }
}

function normalizeAddressList(values: readonly string[] | undefined) {
  return new Set(
    (values ?? [])
      .map((value) => normalizeComparableAddress(value))
      .filter((value): value is string => Boolean(value)),
  );
}

/** Performs synchronous address, self-recipient, trust-list, and block-list checks. */
export function validateRecipientAddress(
  recipient: string | null | undefined,
  options: RecipientLocalValidationOptions = {},
): RecipientLocalValidation {
  const address = recipient?.trim() ?? "";

  if (!address) {
    return {
      address,
      normalizedAddress: null,
      parsedAddress: null,
      reasons: [],
      status: "idle",
    };
  }

  let parsedAddress: Address;
  try {
    parsedAddress = parseAddress(address);
  } catch {
    return {
      address,
      normalizedAddress: null,
      parsedAddress: null,
      reasons: [
        {
          code: "invalid-address",
          severity: "danger",
          message: "Enter a valid Solana address.",
        },
      ],
      status: "invalid",
    };
  }

  const normalizedAddress = parsedAddress;
  const blocked = normalizeAddressList(options.blockedAddresses);
  const trusted = normalizeAddressList(options.trustedAddresses);
  const sender = normalizeComparableAddress(options.sender);

  if (blocked.has(normalizedAddress)) {
    return {
      address,
      normalizedAddress,
      parsedAddress,
      reasons: [
        {
          code: "blocked-address",
          severity: "danger",
          message: "This address is blocked by the application.",
        },
      ],
      status: "blocked",
    };
  }

  if (sender === normalizedAddress) {
    const allowSelf = options.allowSelf === true;
    return {
      address,
      normalizedAddress,
      parsedAddress,
      reasons: [
        {
          code: "self-recipient",
          severity: allowSelf ? "warning" : "danger",
          message: allowSelf
            ? "This transaction sends funds back to the connected wallet."
            : "The recipient matches the connected wallet.",
        },
      ],
      status: allowSelf ? "warning" : "blocked",
    };
  }

  if (trusted.has(normalizedAddress)) {
    return {
      address,
      normalizedAddress,
      parsedAddress,
      reasons: [
        {
          code: "trusted-address",
          severity: "info",
          message: "This address is in the application's trusted list.",
        },
      ],
      status: "safe",
    };
  }

  return {
    address,
    normalizedAddress,
    parsedAddress,
    reasons: [],
    status: "safe",
  };
}

function createValue(
  local: RecipientLocalValidation,
  overrides: Partial<RecipientValidationValue>,
  refetch: () => void,
): RecipientValidationValue {
  const status = overrides.status ?? local.status;

  return {
    status,
    address: local.address,
    normalizedAddress: local.normalizedAddress,
    accountExists: null,
    executable: null,
    owner: null,
    lamports: null,
    reasons: local.reasons,
    error: null,
    isValidAddress: local.parsedAddress !== null,
    isLoading: status === "checking",
    isSafe: status === "safe",
    canSubmit: status === "safe" || status === "warning",
    refetch,
    ...overrides,
  };
}

/**
 * Validates a recipient locally, then reads the real account from Solana RPC.
 * It does not resolve names, call HTTP APIs, or claim that an address is owned
 * by a particular person.
 */
export function useRecipientValidation(
  recipient: string | null | undefined,
  options: RecipientValidationOptions = {},
): RecipientValidationValue {
  const {
    allowSelf = false,
    blockExecutableAccounts = true,
    blockedAddresses,
    commitment = "confirmed",
    connection,
    debounceMs = 300,
    enabled = true,
    requireExistingAccount = false,
    rpcEndpoint: configuredRpcEndpoint,
    sender,
    trustedAddresses,
  } = options;
  const [requestId, setRequestId] = useState(0);
  const [remoteValue, setRemoteValue] = useState<{
    key: string;
    value: RecipientValidationValue;
  } | null>(null);
  const blockedKey = (blockedAddresses ?? []).join(":");
  const trustedKey = (trustedAddresses ?? []).join(":");
  const senderKey = sender?.toString() ?? "";
  const rpcEndpoint = configuredRpcEndpoint ?? connection?.rpcEndpoint;
  const rpc = useMemo(
    () => (rpcEndpoint ? createSolanaRpc(rpcEndpoint) : null),
    [rpcEndpoint],
  );
  const normalizedBlockedAddresses = useMemo(
    () => (blockedKey ? blockedKey.split(":") : []),
    [blockedKey],
  );
  const normalizedTrustedAddresses = useMemo(
    () => (trustedKey ? trustedKey.split(":") : []),
    [trustedKey],
  );
  const local = useMemo(
    () =>
      validateRecipientAddress(recipient, {
        allowSelf,
        blockedAddresses: normalizedBlockedAddresses,
        sender: senderKey,
        trustedAddresses: normalizedTrustedAddresses,
      }),
    [
      allowSelf,
      normalizedBlockedAddresses,
      normalizedTrustedAddresses,
      recipient,
      senderKey,
    ],
  );
  const refetch = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);
  const validationKey = [
    local.normalizedAddress ?? local.address,
    rpcEndpoint ?? "no-rpc",
    commitment,
    requireExistingAccount ? "required" : "optional",
    blockExecutableAccounts ? "block-programs" : "allow-programs",
    allowSelf ? "allow-self" : "block-self",
    senderKey,
    blockedKey,
    trustedKey,
    requestId,
  ].join(":");

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    if (
      !enabled ||
      !local.parsedAddress ||
      local.status === "invalid" ||
      local.status === "blocked"
    ) {
      return;
    }

    if (!rpc) return;

    timer = window.setTimeout(() => {
      void rpc
        .getAccountInfo(local.parsedAddress!, {
          commitment,
          dataSlice: { offset: 0, length: 0 },
          encoding: "base64",
        })
        .send()
        .then(({ value: account }) => {
          if (!active) return;

          const reasons = [...local.reasons];
          let status: RecipientValidationStatus = local.status;

          if (!account) {
            reasons.push({
              code: "account-not-found",
              severity: requireExistingAccount ? "danger" : "warning",
              message: requireExistingAccount
                ? "No account currently exists at this address."
                : "This address has no account yet. A SOL transfer can create it.",
            });
            status = requireExistingAccount ? "blocked" : "warning";
          } else if (account.executable) {
            reasons.push({
              code: "executable-account",
              severity: blockExecutableAccounts ? "danger" : "warning",
              message: blockExecutableAccounts
                ? "This address is an executable program account."
                : "This recipient is an executable program account.",
            });
            status = blockExecutableAccounts ? "blocked" : "warning";
          } else {
            reasons.push({
              code: "account-found",
              severity: "info",
              message: "An on-chain account exists at this address.",
            });
          }

          const value = createValue(
            local,
            {
              status,
              accountExists: Boolean(account),
              executable: account?.executable ?? null,
              owner: account?.owner ?? null,
              lamports: account?.lamports ?? null,
              reasons,
              isLoading: false,
              isSafe: status === "safe",
              canSubmit: status === "safe" || status === "warning",
            },
            refetch,
          );

          setRemoteValue({ key: validationKey, value });
        })
        .catch((cause) => {
          if (!active) return;
          const error =
            cause instanceof Error
              ? cause
              : new Error("Recipient account lookup failed.");
          setRemoteValue({
            key: validationKey,
            value: createValue(
              local,
              {
                status: "error",
                reasons: [
                  ...local.reasons,
                  {
                    code: "rpc-error",
                    severity: "danger",
                    message: error.message,
                  },
                ],
                error,
                isLoading: false,
                isSafe: false,
                canSubmit: false,
              },
              refetch,
            ),
          });
        });
    }, Math.max(0, debounceMs));

    return () => {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [
    blockExecutableAccounts,
    commitment,
    debounceMs,
    enabled,
    local,
    refetch,
    requireExistingAccount,
    rpc,
    validationKey,
  ]);

  if (!enabled || local.status === "idle") {
    return createValue(local, { status: "idle" }, refetch);
  }

  if (
    local.status === "invalid" ||
    local.status === "blocked" ||
    !local.parsedAddress
  ) {
    return createValue(local, {}, refetch);
  }

  if (!rpc) {
    return createValue(
      local,
      {
        status: "warning",
        reasons: [
          ...local.reasons,
          {
            code: "rpc-unavailable",
            severity: "warning",
            message: "Address format is valid, but no RPC connection was provided.",
          },
        ],
        isSafe: false,
        canSubmit: false,
      },
      refetch,
    );
  }

  if (remoteValue?.key === validationKey) return remoteValue.value;

  return createValue(
    local,
    {
      status: "checking",
      isLoading: true,
      isSafe: false,
      canSubmit: false,
    },
    refetch,
  );
}
