"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type {
  TeamMember,
  TeamSummaryResponse,
  InviteTeamMemberPayload,
} from "@/types";

export const TEAM_KEYS = {
  all: ["team"] as const,
  summary: ["team", "summary"] as const,
};

/* ── Get Team Summary & Members ─────────────────────────────────── */
export function useTeamSummary() {
  return useQuery({
    queryKey: TEAM_KEYS.summary,
    queryFn: () => apiGet<TeamSummaryResponse>("/team"),
  });
}

/* ── Invite Team Member ─────────────────────────────────────────── */
export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InviteTeamMemberPayload) =>
      apiPost<{ member: TeamMember; temporaryPassword?: string }>("/team/invite", payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.all });
      toast.success(
        data?.temporaryPassword
          ? `Team member added! Temporary password: ${data.temporaryPassword}`
          : "Team member added successfully!"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add team member");
    },
  });
}

/* ── Update Team Member ─────────────────────────────────────────── */
export function useUpdateTeamMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<TeamMember> & { password?: string }) =>
      apiPut<TeamMember>(`/team/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.all });
      toast.success("Team member updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update team member");
    },
  });
}

/* ── Delete Team Member ─────────────────────────────────────────── */
export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEYS.all });
      toast.success("Team member removed. Seat is now available.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove team member");
    },
  });
}
