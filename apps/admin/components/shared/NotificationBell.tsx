"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package, ShoppingBag, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  submissionId: string | null;
  itemId: string | null;
  orderId: string | null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: string) {
  if (type.includes("SUBMISSION")) return <Package className="h-4 w-4 text-blue-500" />;
  if (type.includes("ORDER")) return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
  return <AlertCircle className="h-4 w-4 text-gray-400" />;
}

function linkForNotif(n: Notification): string | null {
  if (n.submissionId) return `/submissions/${n.submissionId}`;
  if (n.orderId) return `/orders/${n.orderId}`;
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
    refetchInterval: 20_000,
  });

  const notifications = (data as unknown as Notification[]) ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Align dropdown to right edge of button, open downward
      setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 320) });
    }
    setOpen((v) => !v);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) {
        // Check if click is inside the portal panel
        const panel = document.getElementById("notif-panel");
        if (panel && panel.contains(target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const panel = open && typeof window !== "undefined" ? createPortal(
    <div
      id="notif-panel"
      style={{ top: pos.top, left: pos.left }}
      className="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-sm text-gray-900">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const href = linkForNotif(n);
            return (
              <a
                key={n.id}
                href={href ?? "#"}
                onClick={(e) => {
                  if (!href) e.preventDefault();
                  if (!n.isRead) markRead.mutate(n.id);
                  setOpen(false);
                }}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/40" : ""}`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-blue-50" : "bg-gray-100"}`}>
                  {notifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="mt-2 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
              </a>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5 text-center">
        <p className="text-xs text-gray-400">
          {unreadCount > 0 ? `${unreadCount} unread · ` : ""}{notifications.length} total
        </p>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
