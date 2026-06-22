"use client";

import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, AlertOctagon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Announcement } from "@/types";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "vendra_dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const current = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
}

const ANNOUNCEMENT_STYLES = {
  info: {
    wrapper: "bg-blue-950/80 border-blue-800/60 text-blue-200",
    icon: <Info className="size-4 shrink-0 text-blue-400" />,
  },
  warning: {
    wrapper: "bg-amber-950/80 border-amber-800/60 text-amber-200",
    icon: <AlertTriangle className="size-4 shrink-0 text-amber-400" />,
  },
  urgent: {
    wrapper: "bg-rose-950/80 border-rose-800/60 text-rose-200",
    icon: <AlertOctagon className="size-4 shrink-0 text-rose-400" />,
  },
};

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const { data: announcements } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: async () => {
      return apiGet<Announcement[]>("/admin/announcements/active");
    },
    staleTime: 5 * 60_000, // check every 5 minutes
  });

  const visible = (announcements ?? []).filter(
    (ann) => !dismissed.includes(ann._id),
  );

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((ann) => {
        const styles = ANNOUNCEMENT_STYLES[ann.type] ?? ANNOUNCEMENT_STYLES.info;
        const isUrgent = ann.type === "urgent";

        return (
          <div
            key={ann._id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
              styles.wrapper,
            )}
          >
            {styles.icon}
            <div className="flex-1">
              <span className="font-semibold">{ann.title}:</span>{" "}
              <span className="opacity-80">{ann.message}</span>
            </div>
            {/* Urgent announcements are non-dismissible */}
            {!isUrgent && (
              <button
                onClick={() => {
                  dismiss(ann._id);
                  setDismissed(getDismissed());
                }}
                className="flex size-5 shrink-0 items-center justify-center rounded opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
