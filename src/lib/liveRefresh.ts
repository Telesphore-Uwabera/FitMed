const LIVE_KEY = "fitmed:live-refresh";
const LIVE_EVENT = "fitmed-live-refresh";

export function broadcastLiveRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LIVE_EVENT));
  try {
    localStorage.setItem(LIVE_KEY, String(Date.now()));
  } catch {
    // Ignore private-mode storage limits.
  }
}

export function subscribeLiveRefresh(onRefresh: () => void, intervalMs = 7000) {
  if (typeof window === "undefined") return () => undefined;

  const run = () => {
    if (document.visibilityState === "hidden") return;
    onRefresh();
  };

  const tick = window.setInterval(run, intervalMs);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LIVE_KEY) onRefresh();
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") onRefresh();
  };

  window.addEventListener(LIVE_EVENT, onRefresh);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onRefresh);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    window.clearInterval(tick);
    window.removeEventListener(LIVE_EVENT, onRefresh);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onRefresh);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
