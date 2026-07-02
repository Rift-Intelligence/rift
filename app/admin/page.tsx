"use client";

import { Component, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTokens } from "@/lib/billing/token-display";
import { RiftWordmark } from "@/components/icons/rift-wordmark";

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

/**
 * Isolate a section so a backend error (e.g. a query that isn't deployed to
 * this Convex deployment yet) degrades to a notice instead of taking the whole
 * page down.
 */
class SectionErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

type OpenChat = { id: string; title: string; email: string };

function ChatTranscript({
  chat,
  onClose,
}: {
  chat: OpenChat;
  onClose: () => void;
}) {
  const messages = useQuery(api.admin.getAdminChatMessages, {
    chatId: chat.id,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {chat.title}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {chat.email}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent/40"
          >
            Close
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages === undefined ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : messages === null ? (
            <div className="text-sm text-muted-foreground">Not authorized.</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">No messages.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span
                    className={
                      m.role === "user"
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {m.role}
                  </span>
                  {m.mode ? <span>· {m.mode}</span> : null}
                  <span className="ml-auto normal-case tracking-normal">
                    {formatDateTime(m.createdAt)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
                  {m.text || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Activity feed (who wrote what). Lives behind an error boundary because its
 * Convex queries may not be deployed to every environment yet. */
function AdminActivity() {
  const activity = useQuery(api.admin.getAdminActivity);
  const [openChat, setOpenChat] = useState<OpenChat | null>(null);

  return (
    <>
      <div className="mt-10 mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <span className="text-xs text-muted-foreground">
          {activity === undefined || activity === null
            ? ""
            : `${activity.length} chat${activity.length === 1 ? "" : "s"} — click to read`}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Chat</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activity === undefined ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : activity === null || activity.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No chats yet.
                </td>
              </tr>
            ) : (
              activity.map((c) => (
                <tr
                  key={c.chatId}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setOpenChat({
                      id: c.chatId,
                      title: c.title,
                      email: c.email,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenChat({
                        id: c.chatId,
                        title: c.title,
                        email: c.email,
                      });
                    }
                  }}
                  className="cursor-pointer hover:bg-accent/40"
                >
                  <td className="max-w-[180px] px-4 py-3">
                    <div className="truncate text-foreground">{c.email}</div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3">
                    <div className="truncate text-foreground">{c.title}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.mode ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDateTime(c.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openChat ? (
        <ChatTranscript chat={openChat} onClose={() => setOpenChat(null)} />
      ) : null}
    </>
  );
}

export default function AdminPage() {
  const stats = useQuery(api.admin.getAdminStats);

  if (stats === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (stats === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center">
        <RiftWordmark height={16} className="text-foreground" />
        <p className="text-sm text-muted-foreground">
          Not authorized. This page is for admins only.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <RiftWordmark height={16} className="text-foreground" />
          <span className="text-sm text-muted-foreground">Admin</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Users" value={stats.totalUsers.toLocaleString()} />
          <StatCard
            label="Revenue"
            value={`$${stats.totalRevenueDollars.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}`}
          />
          <StatCard
            label="Active (7d)"
            value={stats.activeLast7Days.toLocaleString()}
          />
          <StatCard label="Chats" value={stats.totalChats.toLocaleString()} />
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium text-right">Spent</th>
                <th className="px-4 py-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.users.map((u) => (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.email}</div>
                    {u.name ? (
                      <div className="text-xs text-muted-foreground">
                        {u.name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatTokens(u.balancePoints)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {u.revenueDollars > 0
                      ? `$${u.revenueDollars.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.lastActiveAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Showing {stats.users.length} user
          {stats.users.length === 1 ? "" : "s"}. Balance is in RIFT tokens;
          spent is lifetime gross revenue.
        </p>

        {/* Activity (who wrote what) — isolated so a not-yet-deployed backend
            query degrades gracefully instead of crashing the dashboard. */}
        <SectionErrorBoundary
          fallback={
            <div className="mt-10 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Activity
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Activity feed is unavailable in this environment — its backend
                functions aren&apos;t deployed to the production Convex
                deployment yet.
              </p>
            </div>
          }
        >
          <AdminActivity />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
