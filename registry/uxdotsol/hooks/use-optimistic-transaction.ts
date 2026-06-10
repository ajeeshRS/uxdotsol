"use client";

import { useCallback, useRef, useState } from "react";

export type OptimisticTransactionStatus =
  | "idle"
  | "optimistic"
  | "confirming"
  | "confirmed"
  | "rolled-back";

export type OptimisticTransactionOptions<TState, TResult> = {
  initialState: TState;
  apply: (state: TState) => TState;
  rollback?: (previousState: TState, error: unknown) => TState;
  transaction: () => Promise<TResult>;
  confirm?: (result: TResult) => Promise<unknown>;
  onSuccess?: (result: TResult, state: TState) => void;
  onRollback?: (error: unknown, state: TState) => void;
};

/**
 * Applies an optimistic UI state immediately, then commits after the transaction
 * and optional confirmation succeed. Failures restore the previous state.
 */
export function useOptimisticTransaction<TState, TResult = string>(
  options: OptimisticTransactionOptions<TState, TResult>
) {
  const [state, setState] = useState<TState>(options.initialState);
  const [status, setStatus] = useState<OptimisticTransactionStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<TResult | null>(null);
  const inFlightRef = useRef(false);

  const reset = useCallback((nextState = options.initialState) => {
    inFlightRef.current = false;
    setState(nextState);
    setStatus("idle");
    setError(null);
    setResult(null);
  }, [options.initialState]);

  const run = useCallback(
    async (override?: Partial<Omit<OptimisticTransactionOptions<TState, TResult>, "initialState">>) => {
      if (inFlightRef.current) {
        throw new Error("An optimistic transaction is already in flight.");
      }

      inFlightRef.current = true;
      setError(null);

      let previousState: TState;
      let optimisticState: TState;

      setState((current) => {
        previousState = current;
        optimisticState = (override?.apply ?? options.apply)(current);
        return optimisticState;
      });
      setStatus("optimistic");

      try {
        const txResult = await (override?.transaction ?? options.transaction)();
        setResult(txResult);
        setStatus("confirming");

        await (override?.confirm ?? options.confirm)?.(txResult);

        setStatus("confirmed");
        options.onSuccess?.(txResult, optimisticState!);
        override?.onSuccess?.(txResult, optimisticState!);
        return txResult;
      } catch (caught) {
        const rollback = override?.rollback ?? options.rollback ?? ((prior: TState) => prior);
        const rolledBackState = rollback(previousState!, caught);

        setState(rolledBackState);
        setError(caught);
        setStatus("rolled-back");
        options.onRollback?.(caught, rolledBackState);
        override?.onRollback?.(caught, rolledBackState);
        throw caught;
      } finally {
        inFlightRef.current = false;
      }
    },
    [options]
  );

  return {
    state,
    setState,
    status,
    error,
    result,
    isPending: status === "optimistic" || status === "confirming",
    run,
    reset,
  };
}
