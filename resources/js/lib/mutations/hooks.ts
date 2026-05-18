// TanStack Query MUTATION hooks — one per non-GET endpoint. Every mutation
// invalidates the related cache slice on success so subsequent reads observe
// the new state without manual refetch wiring in components.
//
// Confirm-token protocol (R21): destructive mutations (`useInvokeTool`,
// `useReplayAudit`, `useResetBreaker`) throw `ConfirmTokenError` on the
// first call when the server demands confirmation. The UI catches it,
// prompts the operator, then calls the mutation again with the minted
// token. We do NOT collapse this into a single hook with internal state —
// keeping it explicit makes the destructive UX legible at the call site.

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import * as api from '../api/endpoints';
import { keys } from '../queries/keys';
import type {
  CreateApiKeyRequest,
  HostApiKeyCreateEnvelope,
  McpServer,
  McpServerWrite,
  ToolInvokeResult,
  UpdatePreferencesRequest,
} from '../api/types';

// --------------------------------------------------------------------- //
// Identity
// --------------------------------------------------------------------- //

export function useUpdatePreferences(): UseMutationResult<void, Error, UpdatePreferencesRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updatePreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.me.user() });
    },
  });
}

export function useCreateApiKey(): UseMutationResult<
  HostApiKeyCreateEnvelope,
  Error,
  CreateApiKeyRequest
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.apiKeys.all() });
    },
  });
}

export function useRevokeApiKey(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.revokeApiKey,
    onMutate: async (id) => {
      // Optimistic — drop the key from the cache before the server confirms.
      await qc.cancelQueries({ queryKey: keys.apiKeys.all() });
      const previous = qc.getQueryData(keys.apiKeys.all());
      qc.setQueryData(keys.apiKeys.all(), (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((k: { id: string }) => k.id !== id);
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(keys.apiKeys.all(), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.apiKeys.all() });
    },
  });
}

// --------------------------------------------------------------------- //
// Servers
// --------------------------------------------------------------------- //

export function useCreateServer(): UseMutationResult<McpServer, Error, McpServerWrite> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createServer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.servers.all() });
    },
  });
}

export interface UpdateServerVars {
  id: string;
  patch: Partial<McpServerWrite>;
}

export function useUpdateServer(): UseMutationResult<void, Error, UpdateServerVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateServerVars) => api.updateServer(id, patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.servers.detail(vars.id) });
      qc.invalidateQueries({ queryKey: keys.servers.all() });
    },
  });
}

export function useDeleteServer(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteServer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.servers.all() });
      qc.invalidateQueries({ queryKey: keys.tools.all() });
    },
  });
}

export function useHandshake(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.handshakeServer,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: keys.servers.detail(id) });
      qc.invalidateQueries({ queryKey: keys.servers.tools(id) });
    },
  });
}

// --------------------------------------------------------------------- //
// Tool invocation — two-call confirm-token protocol (R21)
// --------------------------------------------------------------------- //

export interface InvokeToolVars {
  serverId: string;
  toolName: string;
  args?: Record<string, unknown>;
  confirmToken?: string;
}

export function useInvokeTool(): UseMutationResult<ToolInvokeResult, Error, InvokeToolVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, toolName, args, confirmToken }: InvokeToolVars) =>
      api.invokeTool(serverId, toolName, args ?? {}, confirmToken),
    onSuccess: () => {
      // Successful invocation creates a new audit row — invalidate the list.
      qc.invalidateQueries({ queryKey: keys.audit.all() });
    },
  });
}

// --------------------------------------------------------------------- //
// Audit replay
// --------------------------------------------------------------------- //

export interface ReplayAuditVars {
  id: string;
  confirmToken?: string;
}

export function useReplayAudit(): UseMutationResult<unknown, Error, ReplayAuditVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmToken }: ReplayAuditVars) => api.replayAudit(id, confirmToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.audit.all() });
    },
  });
}

// --------------------------------------------------------------------- //
// Circuit-breaker reset
// --------------------------------------------------------------------- //

export interface ResetBreakerVars {
  key: string;
  confirmToken?: string;
}

export function useResetBreaker(): UseMutationResult<void, Error, ResetBreakerVars> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, confirmToken }: ResetBreakerVars) =>
      api.resetBreaker(key, confirmToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.breakers.all() });
    },
  });
}
