"use client";

import { useEffect, useRef, useState } from "react";

interface WatchlistItem {
  id: string;
  label: string;
  value: string;
  meta?: string;
  events?: string[];
  badge?: "new-user";
}

export default function AdminWatchlist({
  items,
  onRemove,
  onClearBadge,
}: {
  items: WatchlistItem[];
  onRemove: (id: string) => void;
  onClearBadge?: (id: string) => void;
}) {
  const defaultPosition = { x: 24, y: 24 };
  const [size, setSize] = useState<"compact" | "large">("large");
  const [view, setView] = useState<"list" | "grid">("list");
  const [position, setPosition] = useState(defaultPosition);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("adminWatchlistPosition");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPosition(parsed);
        }
      } catch {
        setPosition(defaultPosition);
      }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("adminWatchlistLayout");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.size === "compact" || parsed?.size === "large") {
          setSize(parsed.size);
        }
        if (parsed?.view === "list" || parsed?.view === "grid") {
          setView(parsed.view);
        }
      } catch {
        setSize("large");
        setView("list");
      }
    } else if (window.innerWidth < 640) {
      setSize("compact");
      setView("list");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("adminWatchlistPosition", JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    window.localStorage.setItem("adminWatchlistLayout", JSON.stringify({ size, view }));
  }, [size, view]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea")) return;
    event.preventDefault();
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    setPosition({
      x: event.clientX - dragOffset.current.x,
      y: event.clientY - dragOffset.current.y,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOffset.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={`fixed z-50 w-[92vw] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-gray-900 ${
        size === "large" ? "max-w-[640px]" : "max-w-[420px]"
      }`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-start justify-between gap-2 mb-3 select-none cursor-move">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Watchlist</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pinned KPIs for quick tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView((prev) => (prev === "list" ? "grid" : "list"))}
            className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-[#1F6F43] dark:border-white/10 dark:text-gray-400"
          >
            {view === "list" ? "Grid" : "List"}
          </button>
          <button
            type="button"
            onClick={() => setSize((prev) => (prev === "large" ? "compact" : "large"))}
            className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 hover:text-[#1F6F43] dark:border-white/10 dark:text-gray-400"
          >
            {size === "large" ? "Compact" : "Large"}
          </button>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Drag</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
          No pinned metrics yet. Pin items from the insights strip.
        </div>
      ) : (
        <div
          className={`gap-3 max-h-[52vh] overflow-y-auto pr-1 ${
            view === "grid" ? "grid grid-cols-1 sm:grid-cols-2" : "grid grid-cols-1"
          }`}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    {item.badge === "new-user" ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  {item.meta ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>
                  ) : null}
                  {item.events?.length ? (
                    <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.events.slice(0, 5).map((eventText, index) => (
                        <li key={`${item.id}-${index}`} className="truncate">
                          {eventText}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-[11px] font-semibold text-gray-400 hover:text-[#1F6F43]"
                >
                  Remove
                </button>
                {item.badge === "new-user" && onClearBadge ? (
                  <button
                    type="button"
                    onClick={() => onClearBadge(item.id)}
                    className="text-[11px] font-semibold text-gray-400 hover:text-[#1F6F43]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
