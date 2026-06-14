"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { useNotifications, useReadNotification, useReadAllNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: response, isLoading } = useNotifications();
  const readMutation = useReadNotification();
  const readAllMutation = useReadAllNotifications();

  const notifications = response?.data?.notifications || [];
  const unreadCount = response?.data?.unreadCount || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRead = (id: string) => {
    readMutation.mutate(id);
  };

  const handleReadAll = () => {
    readAllMutation.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleReadAll}
                className="text-xs text-brand-purple hover:text-brand-600 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notif: any) => (
                  <div 
                    key={notif._id} 
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3",
                      !notif.isRead && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("text-sm font-medium", !notif.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.actionUrl && (
                        <Link 
                          href={notif.actionUrl}
                          onClick={() => { setIsOpen(false); handleRead(notif._id); }}
                          className="mt-2 inline-flex items-center text-xs font-medium text-brand-purple hover:underline"
                        >
                          View Details <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      )}
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleRead(notif._id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-brand-purple hover:bg-brand-100 shrink-0 self-center"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
