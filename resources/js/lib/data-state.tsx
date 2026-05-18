// @ts-nocheck — `EmptyState` and `Skeleton` from `lib/ui.tsx` are
// auto-converted from the design prototype and their inferred param
// signatures flip every optional prop into a required slot from the
// outside. Properly typing them is tracked alongside the prototype
// converter. The behavioural surface is exercised by the page-level
// Vitest specs.
// Small, reusable wrappers that translate a TanStack `UseQueryResult` into the
// three R14-mandated visible states (loading / error / empty / ready) with the
// R11 testid contract baked in. Every page that consumes a live hook routes
// through one of these so behaviour stays uniform.
//
//   <DataState query={q} testIdBase="dashboard"
//              isEmpty={(d) => d.length === 0}
//              ready={(d) => <Grid items={d} />} />
//
// R14: never silently drop a non-success state on the floor — render either a
//      visible loading affordance, an error message + retry, or an empty
//      state. Loading shows `aria-busy`; error uses `role="alert"`; empty
//      uses `role="status"`.
// R11: the wrapper attaches `data-testid="<base>-loading|error|empty|ready"`
//      on each of the four states so Playwright + Vitest can wait on them
//      without sniffing internal markup. The `-ready` wrapper is a thin
//      `<div role="presentation">` so it doesn't introduce an extra a11y
//      landmark — its only job is to give tests a stable hook.
// R15: keyboard-reachable retry button + meaningful labels on each state.

import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { I, EmptyState, Skeleton } from './ui';

export interface DataStateProps<TData> {
  query: UseQueryResult<TData>;
  testIdBase: string;
  /** Optional predicate. When true the empty-state branch is rendered. */
  isEmpty?: (data: TData) => boolean;
  /** Renderer invoked once the query has succeeded and is non-empty. */
  ready: (data: TData) => React.ReactNode;
  /** Optional custom loading skeleton (defaults to a small stripe). */
  loading?: React.ReactNode;
  /** Optional empty-state override (icon / title / body). */
  empty?: { icon?: React.ReactNode; title?: string; body?: React.ReactNode };
}

export function DataState<TData>({
  query,
  testIdBase,
  isEmpty,
  ready,
  loading,
  empty,
}: DataStateProps<TData>): JSX.Element {
  if (query.isLoading || query.isPending) {
    return (
      <div
        className="data-state loading"
        role="status"
        aria-busy="true"
        aria-live="polite"
        data-testid={`${testIdBase}-loading`}
      >
        {loading ?? <DefaultLoadingSkeleton />}
      </div>
    );
  }

  if (query.isError) {
    const err = query.error as Error | undefined;
    return (
      <div
        className="data-state error"
        role="alert"
        data-testid={`${testIdBase}-error`}
      >
        <EmptyState
          icon={<I.AlertTriangle size={26} />}
          title="Failed to load"
          body={err?.message || 'An unexpected error occurred while loading data.'}
          action={
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                void query.refetch();
              }}
              data-testid={`${testIdBase}-error-retry`}
              aria-label="Retry"
            >
              <I.Refresh size={13} /> Retry
            </button>
          }
        />
      </div>
    );
  }

  const data = query.data as TData;
  const looksEmpty =
    data === undefined ||
    data === null ||
    (isEmpty ? isEmpty(data) : false);

  if (looksEmpty) {
    return (
      <div
        className="data-state empty"
        role="status"
        data-testid={`${testIdBase}-empty`}
      >
        <EmptyState
          icon={empty?.icon ?? <I.Info size={26} />}
          title={empty?.title ?? 'Nothing to show'}
          body={empty?.body ?? 'There is no data for this view yet.'}
        />
      </div>
    );
  }

  // Wrap the ready render in a sentinel div carrying `data-testid="<base>-ready"`
  // so test code can wait on the successful state symmetrically with the
  // loading/error/empty states. `role="presentation"` keeps the wrapper
  // out of the a11y tree.
  return (
    <div
      className="data-state ready"
      role="presentation"
      data-testid={`${testIdBase}-ready`}
    >
      {ready(data)}
    </div>
  );
}

function DefaultLoadingSkeleton(): JSX.Element {
  return (
    <div className="row-gap-8" style={{ padding: 16 }}>
      <Skeleton w="40%" h={16} />
      <Skeleton w="80%" h={14} />
      <Skeleton w="60%" h={14} />
      <Skeleton w="90%" h={14} />
      <Skeleton w="50%" h={14} />
    </div>
  );
}
