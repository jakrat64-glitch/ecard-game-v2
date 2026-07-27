"use client";

import { useEffect, useState } from "react";
import { ALL_CARD_ASSET_URLS } from "@/lib/constants";

interface AssetPreloaderProps {
  onDone?: () => void;
  children: React.ReactNode;
}

/**
 * Preloads all card face/back images before rendering children. This is
 * critical for the reveal sequence: if `emperor.jpg` hasn't hit the browser
 * cache yet, the 3D flip animation will show a blank/flickering card right
 * at the moment of maximum dramatic tension. We block on this once, at app
 * mount, rather than re-checking per-card during gameplay.
 */
export function AssetPreloader({ onDone, children }: AssetPreloaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;

    const total = ALL_CARD_ASSET_URLS.length;

    const promises = ALL_CARD_ASSET_URLS.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.src = src;
        const markLoaded = () => {
          loadedCount += 1;
          if (!cancelled) setProgress(Math.round((loadedCount / total) * 100));
          resolve();
        };
        img.onload = markLoaded;
        // Resolve on error too — we don't want a single missing asset to
        // permanently block the whole app from ever rendering.
        img.onerror = markLoaded;
      });
    });

    Promise.all(promises).then(() => {
      if (!cancelled) {
        setLoaded(true);
        onDone?.();
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
        <div className="text-red-500 text-2xl font-bold tracking-[0.3em] mb-6 animate-pulse">
          E-CARD
        </div>
        <div className="w-56 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-red-900/40">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-400 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-neutral-500 text-xs mt-3 tracking-widest">
          LOADING ASSETS {progress}%
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
