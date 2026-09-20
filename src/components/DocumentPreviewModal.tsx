"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  FileText,
  IdCard,
  FileBadge,
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export interface DocumentPreviewItem {
  url: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "blue" | "amber" | "emerald" | "purple" | "teal" | "slate";
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentPreviewItem | null;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document: doc,
}: DocumentPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pan state for zoomed images
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset viewport state on new document
  useEffect(() => {
    if (isOpen && doc) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, doc?.url]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || (e.ctrlKey && e.key === "=")) {
        e.preventDefault();
        setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
      } else if (e.key === "-" || (e.ctrlKey && e.key === "-")) {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
      } else if (e.key === "0" && e.ctrlKey) {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      } else if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        // let browser reload work normally
      } else if (e.key === "r" || e.key === "R") {
        setRotation((r) => (r + 90) % 360);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !doc) return null;

  const isPdf =
    doc.url.toLowerCase().endsWith(".pdf") ||
    doc.url.toLowerCase().includes(".pdf?") ||
    doc.url.includes("/raw/upload/") && doc.url.toLowerCase().includes(".pdf");

  const badgeStyles: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
    amber: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
    purple: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
    teal: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700",
    slate: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
  };

  const getDocIcon = () => {
    const text = (doc.title + " " + (doc.badge || "")).toLowerCase();
    if (text.includes("national id") || text.includes("passport")) {
      return <IdCard className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
    if (text.includes("license")) {
      return <FileBadge className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
    }
    if (text.includes("diploma")) {
      return <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-[#12B8B0] shrink-0" />;
  };

  // Mouse pan handlers for zoomed image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(doc.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = blobUrl;
      const ext = isPdf ? ".pdf" : ".jpg";
      const cleanName = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${cleanName || "document"}${ext}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      window.open(doc.url, "_blank");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#071d3d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isMaximized
            ? "h-[98vh] max-w-[98vw]"
            : "h-[90vh] max-w-5xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-white/95 dark:bg-[#071d3d]/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 shrink-0">
              {getDocIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[#0B2D5C] dark:text-white text-base truncate">
                  {doc.title}
                </h3>
                {doc.badge && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      badgeStyles[doc.badgeColor || "slate"]
                    }`}
                  >
                    {doc.badge}
                  </span>
                )}
              </div>
              {doc.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {doc.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* ── Toolbar Actions ── */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPdf && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1 min-w-[45px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Rotate (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {(zoom !== 1 || rotation !== 0 || pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setRotation(0);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[#12B8B0] transition-colors"
                    title="Reset View"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
              </>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </button>

            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Open in new window / tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={isMaximized ? "Restore Size" : "Maximize Screen"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 transition-colors ml-1"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Document Viewport ── */}
        <div
          className={`flex-1 overflow-hidden relative flex items-center justify-center bg-slate-900/95 dark:bg-slate-950 select-none ${
            zoom > 1 && !isPdf ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Subtle Grid Backdrop */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-sm z-20 text-white">
              <Loader2 className="w-8 h-8 animate-spin text-[#12B8B0]" />
              <p className="text-xs font-semibold text-slate-300">Loading document preview...</p>
            </div>
          )}

          {/* Error State */}
          {hasError ? (
            <div className="p-8 text-center max-w-md z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Direct preview unavailable</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  This document format or hosting security restricts direct embedding. You can view or download it directly below.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-extrabold text-xs hover:bg-[#1dd9d0] transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in External Tab</span>
                </a>
              </div>
            </div>
          ) : isPdf ? (
            /* PDF Document Viewer */
            <div className="w-full h-full relative z-10">
              <iframe
                src={`${doc.url}#toolbar=1&navpanes=0`}
                title={doc.title}
                className="w-full h-full border-0 bg-white"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : (
            /* Image Document Viewer */
            <div
              className="relative transition-transform duration-100 ease-out z-10 flex items-center justify-center max-w-full max-h-full p-4"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={doc.url}
                alt={doc.title}
                className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                draggable={false}
              />
            </div>
          )}

          {/* Floating Instructions / Hint */}
          {!isPdf && !hasError && zoom > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] text-white/80 font-medium z-20 pointer-events-none">
              Click & drag to pan · Scroll or use +/- to zoom
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#071d3d] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              FitMed In-Dashboard Document Viewer
            </span>
            <span className="hidden sm:inline text-slate-400">· Confidential medical and licensing records</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>,
    window.document.body
  );
}
