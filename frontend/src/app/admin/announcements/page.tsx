"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AdminPageHeader,
  AdminTableShell,
  AdminEmptyState,
  AdminSkeleton,
  AnnouncementTypeBadge,
  ConfirmModal,
} from "@/components/admin/AdminPrimitives";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/hooks/useAdmin";
import type { Announcement, AnnouncementFormValues, AnnouncementType, SubscriptionPlan } from "@/types";
import { format } from "date-fns";

/* Zod schema */
const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  message: z.string().min(1, "Message is required").max(1000),
  type: z.enum(["info", "warning", "urgent"]),
  targetTier: z.string().nullable(),
  expiresAt: z.string().nullable(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const PLAN_OPTIONS = [
  { value: "", label: "All vendors" },
  { value: "free", label: "Free" },
  { value: "stitch", label: "Stitch" },
  { value: "drape", label: "Drape" },
  { value: "atelier", label: "Atelier" },
  { value: "maison", label: "Maison" },
];

function AnnouncementForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: AnnouncementFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      targetTier: null,
      expiresAt: null,
      isActive: true,
      ...defaultValues,
    },
  });

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20";

  return (
    <form
      onSubmit={handleSubmit((vals) =>
        onSubmit({
          ...vals,
          type: vals.type as AnnouncementType,
          targetTier: (vals.targetTier as SubscriptionPlan) || null,
          expiresAt: vals.expiresAt || null,
        }),
      )}
      className="space-y-4"
    >
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">
          Title *
        </label>
        <input {...register("title")} placeholder="Announcement title" className={inputClass} />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">
          Message *
        </label>
        <textarea
          {...register("message")}
          rows={4}
          placeholder="Write your message to vendors…"
          className={inputClass}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Type</label>
          <select {...register("type")} className={`${inputClass} capitalize`}>
            {(["info", "warning", "urgent"] as const).map((t) => (
              <option key={t} value={t} className="bg-[#161B22] capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Target Tier
          </label>
          <select {...register("targetTier")} className={`${inputClass} capitalize`}>
            {PLAN_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value} className="bg-[#161B22]">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">
          Expiry Date (optional)
        </label>
        <input
          {...register("expiresAt")}
          type="datetime-local"
          className={`${inputClass} [color-scheme:dark]`}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/50 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Publish"}
        </button>
      </div>
    </form>
  );
}

export default function AdminAnnouncementsPage() {
  const { data: announcements, isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function handleToggleActive(ann: Announcement) {
    updateMutation.mutate({
      id: ann._id,
      title: ann.title,
      message: ann.message,
      type: ann.type,
      targetTier: ann.targetTier,
      expiresAt: ann.expiresAt,
      isActive: !ann.isActive,
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Publish platform-wide messages to vendors"
        action={
          !showCreateForm && !editTarget ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
            >
              <Plus className="size-4" />
              New Announcement
            </button>
          ) : null
        }
      />

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 rounded-xl border border-indigo-500/20 bg-[#161B22] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Create Announcement
          </h2>
          <AnnouncementForm
            onSubmit={(values) => {
              createMutation.mutate(values, {
                onSuccess: () => setShowCreateForm(false),
              });
            }}
            onCancel={() => setShowCreateForm(false)}
            isPending={createMutation.isPending}
          />
        </div>
      )}

      {/* Edit Form */}
      {editTarget && (
        <div className="mb-6 rounded-xl border border-indigo-500/20 bg-[#161B22] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Edit Announcement
          </h2>
          <AnnouncementForm
            defaultValues={{
              title: editTarget.title,
              message: editTarget.message,
              type: editTarget.type,
              targetTier: editTarget.targetTier ?? null,
              expiresAt: editTarget.expiresAt ?? null,
              isActive: editTarget.isActive,
            }}
            onSubmit={(values) => {
              updateMutation.mutate(
                { id: editTarget._id, ...values },
                { onSuccess: () => setEditTarget(null) },
              );
            }}
            onCancel={() => setEditTarget(null)}
            isPending={updateMutation.isPending}
          />
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <AdminSkeleton rows={4} />
      ) : !announcements || announcements.length === 0 ? (
        <AdminEmptyState
          title="No announcements yet"
          description="Create your first announcement to notify vendors"
        />
      ) : (
        <AdminTableShell>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Title", "Type", "Target", "Status", "Expires", "Created", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {announcements.map((ann) => (
                <tr key={ann._id} className="group">
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="truncate font-medium text-white/80">{ann.title}</p>
                    <p className="mt-0.5 truncate text-xs text-white/30">
                      {ann.message}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AnnouncementTypeBadge type={ann.type} />
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-white/50">
                    {ann.targetTier ?? "All vendors"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(ann)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      {ann.isActive ? (
                        <>
                          <ToggleRight className="size-4 text-emerald-400" />
                          <span className="text-emerald-400">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="size-4 text-white/30" />
                          <span className="text-white/30">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    {ann.expiresAt
                      ? format(new Date(ann.expiresAt), "MMM d, yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    {format(new Date(ann.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setEditTarget(ann)}
                        className="flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white/70"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(ann._id)}
                        className="flex size-7 items-center justify-center rounded-md text-white/40 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableShell>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete announcement?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
