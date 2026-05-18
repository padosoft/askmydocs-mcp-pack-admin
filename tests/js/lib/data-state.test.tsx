// Unit tests for `<DataState>` — the shared wrapper that translates a
// TanStack `UseQueryResult` into the four R14-mandated visible states.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DataState } from '../../../resources/js/lib/data-state';

function makeQuery<T>(overrides: Partial<any>) {
  return {
    data: undefined,
    isLoading: false,
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
    ...overrides,
  } as any;
}

describe('<DataState>', () => {
  it('renders the loading state with role=status + aria-busy when isLoading', () => {
    render(
      <DataState
        query={makeQuery({ isLoading: true })}
        testIdBase="foo"
        ready={() => <div>ready</div>}
      />,
    );
    const el = screen.getByTestId('foo-loading');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-busy', 'true');
    expect(el).toHaveAttribute('role', 'status');
  });

  it('renders the loading state when isPending (TanStack v5 idle hooks)', () => {
    render(
      <DataState
        query={makeQuery({ isPending: true })}
        testIdBase="foo"
        ready={() => <div>ready</div>}
      />,
    );
    expect(screen.getByTestId('foo-loading')).toBeInTheDocument();
  });

  it('renders the error state with role=alert + retry button when isError', () => {
    render(
      <DataState
        query={makeQuery({ isError: true, error: new Error('boom') })}
        testIdBase="foo"
        ready={() => <div>ready</div>}
      />,
    );
    const el = screen.getByTestId('foo-error');
    expect(el).toHaveAttribute('role', 'alert');
    expect(el.textContent).toContain('boom');
    expect(screen.getByTestId('foo-error-retry')).toBeInTheDocument();
  });

  it('retry button calls refetch on the query', () => {
    const refetch = vi.fn();
    render(
      <DataState
        query={makeQuery({ isError: true, error: new Error('x'), refetch })}
        testIdBase="foo"
        ready={() => <div>ready</div>}
      />,
    );
    fireEvent.click(screen.getByTestId('foo-error-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state with role=status when isEmpty returns true', () => {
    render(
      <DataState
        query={makeQuery({ data: [] })}
        testIdBase="foo"
        isEmpty={(d: any[]) => d.length === 0}
        ready={() => <div>ready</div>}
      />,
    );
    const el = screen.getByTestId('foo-empty');
    expect(el).toHaveAttribute('role', 'status');
  });

  it('renders the ready children when data is non-empty', () => {
    render(
      <DataState
        query={makeQuery({ data: [{ id: 'a' }] })}
        testIdBase="foo"
        isEmpty={(d: any[]) => d.length === 0}
        ready={() => <div data-testid="foo-ready-body">ready</div>}
      />,
    );
    expect(screen.getByTestId('foo-ready-body')).toBeInTheDocument();
    expect(screen.queryByTestId('foo-empty')).not.toBeInTheDocument();
  });

  it('wraps the ready branch in a sentinel with data-testid="<base>-ready"', () => {
    // The header comment advertises an R11 testid contract on the
    // ready branch; this test pins that contract so future refactors
    // can't silently drop it.
    render(
      <DataState
        query={makeQuery({ data: [{ id: 'a' }] })}
        testIdBase="foo"
        isEmpty={(d: any[]) => d.length === 0}
        ready={() => <div data-testid="foo-ready-body">payload</div>}
      />,
    );
    const sentinel = screen.getByTestId('foo-ready');
    expect(sentinel).toBeInTheDocument();
    expect(sentinel).toHaveAttribute('role', 'presentation');
    expect(sentinel).toContainElement(screen.getByTestId('foo-ready-body'));
  });

  it('treats undefined data as empty even without an `isEmpty` predicate', () => {
    render(
      <DataState
        query={makeQuery({ data: undefined })}
        testIdBase="foo"
        ready={() => <div>ready</div>}
      />,
    );
    expect(screen.getByTestId('foo-empty')).toBeInTheDocument();
  });

  it('uses a custom empty override when provided', () => {
    render(
      <DataState
        query={makeQuery({ data: [] })}
        testIdBase="foo"
        isEmpty={() => true}
        empty={{ title: 'Custom empty', body: 'Nothing yet here' }}
        ready={() => <div>ready</div>}
      />,
    );
    const el = screen.getByTestId('foo-empty');
    expect(el.textContent).toContain('Custom empty');
    expect(el.textContent).toContain('Nothing yet here');
  });
});
