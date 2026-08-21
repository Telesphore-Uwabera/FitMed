"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from "lucide-react";
import BrandSelect from "@/components/BrandSelect";

function plaintextToHtml(value: string) {
  const text = String(value || "");
  if (/<(p|div|br|strong|em|u|h[1-6]|ul|ol|li|a)\b/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function isVisuallyEmpty(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").trim();
  return !text;
}

type Props = {
  defaultValue?: string;
  onChange?: (html: string) => void;
  minHeight?: number;
};

export default function RichTextEditor({
  defaultValue = "",
  onChange,
  minHeight = 280,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState("1.65");

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = plaintextToHtml(defaultValue);
    editorRef.current.style.lineHeight = lineHeight;
    onChange?.(editorRef.current.innerHTML);
    // Seed once per dialog open / default message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const emit = () => {
    if (!editorRef.current) return;
    onChange?.(editorRef.current.innerHTML);
  };

  const run = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const applyLineHeight = (value: string) => {
    setLineHeight(value);
    const root = editorRef.current;
    if (!root) return;
    root.style.lineHeight = value;
    root.querySelectorAll<HTMLElement>("p, h2, h3, li, div").forEach((el) => {
      el.style.lineHeight = value;
    });
    emit();
  };

  const tools: Array<{ label: string; icon: typeof Bold; onClick: () => void } | "sep"> = [
    { label: "Bold", icon: Bold, onClick: () => run("bold") },
    { label: "Italic", icon: Italic, onClick: () => run("italic") },
    { label: "Underline", icon: Underline, onClick: () => run("underline") },
    "sep",
    { label: "Heading", icon: Heading2, onClick: () => run("formatBlock", "h2") },
    { label: "Subheading", icon: Heading3, onClick: () => run("formatBlock", "h3") },
    { label: "Paragraph", icon: Type, onClick: () => run("formatBlock", "p") },
    "sep",
    { label: "Bullet list", icon: List, onClick: () => run("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, onClick: () => run("insertOrderedList") },
    "sep",
    {
      label: "Link",
      icon: LinkIcon,
      onClick: () => {
        const url = window.prompt("Paste the link URL", "https://");
        if (url) run("createLink", url.trim());
      },
    },
    { label: "Remove link", icon: Unlink, onClick: () => run("unlink") },
    "sep",
    { label: "Align left", icon: AlignLeft, onClick: () => run("justifyLeft") },
    { label: "Align center", icon: AlignCenter, onClick: () => run("justifyCenter") },
    { label: "Align right", icon: AlignRight, onClick: () => run("justifyRight") },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#0c1c33]">
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10243f]">
        {tools.map((tool, index) =>
          tool === "sep" ? (
            <span key={`sep-${index}`} className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
          ) : (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={tool.onClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-[#0B2D5C] hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200"
            >
              <tool.icon className="w-4 h-4" />
            </button>
          )
        )}
        <div className="ml-auto w-[132px]">
          <BrandSelect
            size="compact"
            value={lineHeight}
            onChange={applyLineHeight}
            options={[
              { value: "1.2", label: "Tight" },
              { value: "1.65", label: "Normal" },
              { value: "1.9", label: "Relaxed" },
              { value: "2.2", label: "Wide" },
            ]}
          />
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Email message"
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        style={{ minHeight, lineHeight }}
        className="rich-email-editor w-full px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none overflow-y-auto max-h-[52vh]"
      />
      <style>{`
        .rich-email-editor h2 { font-size: 1.25rem; font-weight: 800; color: #0b2d5c; margin: 0.65rem 0 0.35rem; }
        .rich-email-editor h3 { font-size: 1.05rem; font-weight: 800; color: #0b2d5c; margin: 0.5rem 0 0.3rem; }
        .rich-email-editor p { margin: 0 0 0.7rem; }
        .rich-email-editor ul { list-style: disc; padding-left: 1.35rem; margin: 0 0 0.7rem; }
        .rich-email-editor ol { list-style: decimal; padding-left: 1.35rem; margin: 0 0 0.7rem; }
        .rich-email-editor a { color: #0d9488; text-decoration: underline; font-weight: 700; }
      `}</style>
    </div>
  );
}

export { plaintextToHtml, isVisuallyEmpty };
