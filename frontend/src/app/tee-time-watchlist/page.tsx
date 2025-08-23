"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTeeTimeWatchlists, deleteTeeTimeWatchlist, type TeeTimeWatchlist } from "@/services/teeTimeWatchlistService";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash, Info } from "lucide-react";
import { toast } from "sonner";

export default function TeeTimeWatchlistPage() {
  const formatDateMonthDay = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  function TruncatedCourses({ courses }: { courses: string }) {
    const textRef = useRef<HTMLSpanElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [open, setOpen] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; width: number; maxHeight: number }>({ top: 0, left: 0, width: 320, maxHeight: 240 });

    useEffect(() => {
      const el = textRef.current;
      if (!el) return;
      // Defer to ensure layout is settled
      const id = requestAnimationFrame(() => {
        try {
          setIsTruncated(el.scrollWidth > el.clientWidth);
        } catch {}
      });
      return () => cancelAnimationFrame(id);
    }, [courses]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!open) return;
        const container = containerRef.current;
        if (container && !container.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const computeAndSetTooltipPosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const sideMargin = 8;
      const width = Math.max(200, Math.min(360, viewportW - sideMargin * 2));
      const maxHeight = Math.max(120, Math.min(360, viewportH - sideMargin * 2));
      const estimatedHeight = Math.min(240, maxHeight);

      const spaceBelow = viewportH - rect.bottom - sideMargin;
      const spaceAbove = rect.top - sideMargin;
      const placeBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;

      let top = placeBelow ? rect.bottom + sideMargin : rect.top - estimatedHeight - sideMargin;
      if (top < sideMargin) top = sideMargin;
      if (top + estimatedHeight > viewportH - sideMargin) top = Math.max(sideMargin, viewportH - sideMargin - estimatedHeight);

      // Always position tooltip to the left of the icon
      let left = rect.left - sideMargin - width;
      if (left < sideMargin) left = sideMargin; // clamp within viewport

      setTooltipPos({ top, left, width, maxHeight });
    };

    const toggleOpen = () => {
      if (!isTruncated) return;
      computeAndSetTooltipPosition();
      setOpen((v) => !v);
    };

    useEffect(() => {
      if (!open) return;
      const handler = () => computeAndSetTooltipPosition();
      window.addEventListener('resize', handler);
      window.addEventListener('scroll', handler, true);
      return () => {
        window.removeEventListener('resize', handler);
        window.removeEventListener('scroll', handler, true);
      };
    }, [open]);

    return (
      <div ref={containerRef} className="relative flex items-center gap-1">
        <span ref={textRef} className="block w-24 sm:w-48 md:w-64 truncate align-middle">
          {courses}
        </span>
        {isTruncated && (
          <button
            ref={buttonRef}
            type="button"
            aria-label="Show full courses"
            onClick={toggleOpen}
            className="inline-flex items-center justify-center w-5 h-5 rounded-none border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
        {isTruncated && open && (
          <div
            className="fixed z-[9999] rounded-lg bg-slate-800 text-white text-xs shadow-2xl p-3"
            style={{ top: tooltipPos.top, left: tooltipPos.left, width: `${tooltipPos.width}px`, maxHeight: `${tooltipPos.maxHeight}px` }}
          >
            <div className="overflow-auto whitespace-normal break-words" style={{ maxHeight: `${tooltipPos.maxHeight - 8}px` }}>{courses}</div>
          </div>
        )}
      </div>
    );
  }

  const [watchlists, setWatchlists] = useState<TeeTimeWatchlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getTeeTimeWatchlists();
        if (!isMounted) return;
        setWatchlists(data ?? []);
      } catch {
        if (!isMounted) return;
        setError("Failed to load watchlists");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tee Time Watchlist</h1>
            <p className="text-gray-600 max-w-2xl">
              Manage your current watchlists. Create new ones to get notified about last‑minute cancellations and upcoming tee times.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/tee-time-watchlist/create">Create Watchlist</Link>
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Watchlists</h2>

            {loading ? (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Time Range</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Players</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Holes</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Region</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Courses</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden lg:table-cell">Created</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-xs sm:text-sm font-semibold text-gray-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[0, 1, 2].map((i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 sm:py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3"><Skeleton className="h-4 w-36" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 hidden lg:table-cell"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-right"><Skeleton className="h-8 w-8 inline-block" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>
            ) : watchlists.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-500">No watchlists created yet.</p>
                <p className="text-gray-500">Click &quot;Create Watchlist&quot; to set up your first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Time Range</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Players</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Holes</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden md:table-cell">Region</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900">Courses</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-gray-900 hidden lg:table-cell">Created</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-xs sm:text-sm font-semibold text-gray-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {watchlists.map((wl) => (
                      <tr key={wl.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 leading-tight whitespace-nowrap">{formatDateMonthDay(wl.date)}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 leading-tight whitespace-nowrap">{wl.start_hour} - {wl.end_hour}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 leading-tight whitespace-nowrap hidden md:table-cell">{wl.num_of_players}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 leading-tight whitespace-nowrap hidden md:table-cell">{wl.holes}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 leading-tight whitespace-nowrap hidden md:table-cell">{wl.region || "—"}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 leading-tight">
                          <TruncatedCourses courses={wl.courses.map((c) => c.name).join(", ")} />
                        </td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 leading-tight whitespace-nowrap hidden lg:table-cell">{wl.created_at ? new Date(wl.created_at).toLocaleString() : "—"}</td>
                        <td className="px-2 sm:px-3 py-2 sm:py-3 text-right">
                          <button
                            aria-label="Delete watchlist"
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-red-600 hover:text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            onClick={async () => {
                              const confirmDelete = window.confirm("Are you sure you want to delete this watchlist?");
                              if (!confirmDelete) return;
                              setDeletingIds((prev) => new Set(prev).add(wl.id));
                              try {
                                await deleteTeeTimeWatchlist(wl.id);
                                setWatchlists((prev) => prev.filter((w) => w.id !== wl.id));
                                toast.success("Watchlist deleted");
                              } catch {
                                toast.error("Failed to delete watchlist");
                              } finally {
                                setDeletingIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(wl.id);
                                  return next;
                                });
                              }
                            }}
                            disabled={deletingIds.has(wl.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
