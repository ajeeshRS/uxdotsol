import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  useApiResource,
  type ApiResourceAdapter,
} from "@/registry/uxdotsol/hooks/use-api-resource";
import { useSmartRetry } from "@/registry/uxdotsol/hooks/use-smart-retry";
import { useTransactionStatus } from "@/registry/uxdotsol/hooks/use-transaction-status";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("useApiResource", () => {
  it("ignores stale results and aborts superseded requests", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const signals: AbortSignal[] = [];
    const adapter: ApiResourceAdapter<string, string> = vi.fn(
      (input, { signal }) => {
        signals.push(signal);
        return input === "first" ? first.promise : second.promise;
      },
    );

    const { result, rerender } = renderHook(
      ({ input }) =>
        useApiResource({
          adapter,
          enabled: true,
          input,
          requestKey: input,
        }),
      { initialProps: { input: "first" } },
    );

    rerender({ input: "second" });
    expect(signals[0]?.aborted).toBe(true);

    await act(async () => second.resolve("newest"));
    await waitFor(() => expect(result.current.data).toBe("newest"));

    await act(async () => first.resolve("stale"));
    expect(result.current.data).toBe("newest");
    expect(result.current.status).toBe("success");
  });

  it("stays idle while disabled", () => {
    const adapter = vi.fn();
    const { result } = renderHook(() =>
      useApiResource({
        adapter,
        enabled: false,
        input: "ignored",
        requestKey: "ignored",
      }),
    );

    expect(result.current).toMatchObject({
      status: "idle",
      data: null,
      error: null,
    });
    expect(adapter).not.toHaveBeenCalled();
  });
});

describe("useSmartRetry", () => {
  it("retries retryable failures and reports the successful attempt", async () => {
    const onRetry = vi.fn();
    const operation = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error("429 rate limit"))
      .mockResolvedValueOnce("signature");
    const { result } = renderHook(() =>
      useSmartRetry<string>({ baseDelayMs: 0, jitter: false, onRetry }),
    );

    let value: string | undefined;
    await act(async () => {
      value = await result.current.execute(operation);
    });

    expect(value).toBe("signature");
    expect(operation).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(Error),
      1,
      0,
      expect.objectContaining({ reason: "rate-limited" }),
    );
    expect(result.current).toMatchObject({ attempt: 2, isRetrying: false });
  });

  it("does not retry simulation failures", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("simulation failed"));
    const { result } = renderHook(() =>
      useSmartRetry({ baseDelayMs: 0, jitter: false }),
    );

    await act(async () => {
      await expect(result.current.execute(operation)).rejects.toThrow(
        "simulation failed",
      );
    });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
  });
});

describe("useTransactionStatus", () => {
  it("reaches the requested commitment from a Kit-style RPC response", async () => {
    const client = {
      getSignatureStatuses: vi.fn(() => ({
        send: vi.fn().mockResolvedValue({
          value: [
            {
              err: null,
              confirmations: 1,
              confirmationStatus: "confirmed",
            },
          ],
        }),
      })),
    };
    const { result } = renderHook(() =>
      useTransactionStatus({
        client,
        signature: "test-signature",
        subscribe: false,
        pollIntervalMs: 60_000,
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("confirmed"));
    expect(result.current).toMatchObject({
      confirmations: 1,
      isPending: false,
      isTerminal: true,
    });
  });

  it("fails explicitly when a signature has no RPC client", async () => {
    const { result } = renderHook(() =>
      useTransactionStatus({ client: null, signature: "test-signature" }),
    );

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.error).toEqual(new Error("Missing Solana client."));
    expect(result.current.isTerminal).toBe(true);
  });
});
