"use client";

import { FormEvent, ReactNode, useRef, useState } from "react";
import { Bot, CheckCircle2, Send, Sparkles, X } from "lucide-react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { SpatialAction } from "@/types/cosmos";

const QUICK_PROMPTS = [
  "Fly to Moon & slice open core",
  "Fly to JWST at L2",
  "Show Asteroid Bennu & NEOs",
  "Show Van Allen belts & Magnetosphere",
  "Fly to DSCOVR at L1",
  "Fly to ISS & open interior",
];

function formatActionChip(a: SpatialAction): string {
  switch (a.type) {
    case "fly_to_target":
      return `Fly → ${a.targetId.toUpperCase()}`;
    case "set_view_mode":
      return `View → ${a.viewMode}`;
    case "set_persona":
      return `Persona → ${a.persona}`;
    case "set_spectral_mode":
      return `Sensor → ${a.spectralMode}`;
    case "set_hud_mode":
      return `HUD → ${a.hudMode}`;
    case "control_time":
      return a.resetToLive
        ? "Time → 1x LIVE"
        : a.paused
        ? "Time → Paused"
        : `Time → ${a.multiplier ?? 1}x`;
    case "open_panel":
      return `Panel → ${a.panel}`;
    case "set_shell1b_layer":
      return `${a.layer} → ${a.enabled ? "ON" : "OFF"}`;
    case "set_shell2_layer":
      return `${a.layer} → ${a.enabled ? "ON" : "OFF"}`;
    case "set_moon_cutaway":
      return `Moon Core Cutaway → ${Math.round(a.amount * 100)}%`;
  }
}

function prettifyMathExpression(expr: string): string {
  return expr
    .replace(/\\rightarrow|\\to/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\approx/g, "≈")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\geq|\\ge/g, "≥")
    .replace(/\\leq|\\le/g, "≤")
    .replace(/\\mu/g, "μ")
    .replace(/\\pi/g, "π")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\lambda/g, "λ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/_\{?0\}?/g, "₀")
    .replace(/_\{?1\}?/g, "₁")
    .replace(/_\{?2\}?/g, "₂")
    .replace(/_\{?3\}?/g, "₃")
    .replace(/_\{?4\}?/g, "₄")
    .replace(/\^\{?2\}?/g, "²")
    .replace(/\^\{?3\}?/g, "³")
    .replace(/\^\{?4\}?/g, "⁴")
    .replace(/\\/g, "")
    .trim();
}

/**
 * Lightweight zero-dependency Markdown renderer for headings, dividers, bold (**...**),
 * italic (*...*), inline code (`...`), math expressions ($...$), and bullet lists.
 */
function renderInlineMarkdown(text: string): ReactNode[] {
  const cleaned = text
    .replace(/\$\$([^$]+)\$\$/g, (_, m: string) => `\`${prettifyMathExpression(m)}\``)
    .replace(/\$([^$]+)\$/g, (_, m: string) => `\`${prettifyMathExpression(m)}\``);
  const parts = cleaned.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-sky-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} className="italic text-sky-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-0.5" />;
        if (/^-{3,}$/.test(trimmed)) {
          return <hr key={i} className="border-slate-800 my-1" />;
        }
        const headingMatch = trimmed.match(/^#{1,4}\s+(.*)$/);
        if (headingMatch) {
          return (
            <div key={i} className="pt-0.5 font-mono text-[11px] font-bold text-sky-300">
              {renderInlineMarkdown(headingMatch[1])}
            </div>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-sky-400">•</span>
              <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export function AICommander() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const aiDrawerOpen = useCosmosStore((s) => s.aiDrawerOpen);
  const setAiDrawerOpen = useCosmosStore((s) => s.setAiDrawerOpen);
  const chatMessages = useCosmosStore((s) => s.chatMessages);
  const addChatMessage = useCosmosStore((s) => s.addChatMessage);
  const aiLoading = useCosmosStore((s) => s.aiLoading);
  const setAiLoading = useCosmosStore((s) => s.setAiLoading);
  const dispatchSpatialActions = useCosmosStore((s) => s.dispatchSpatialActions);

  if (!aiDrawerOpen) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || aiLoading) return;

    addChatMessage({
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    });
    setInput("");
    setAiLoading(true);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 30);

    try {
      const s = useCosmosStore.getState();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);
      let res: Response;
      try {
        res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: trimmed,
            context: {
              persona: s.persona,
              viewMode: s.viewMode,
              spectralMode: s.spectralMode,
              hudMode: s.hudMode,
              selectedTargetId: s.selectedTargetId,
              selectedIssModuleId: s.selectedIssModuleId,
              observerCityName: `${s.observerCity.name}, ${s.observerCity.country}`,
              telemetry: s.selectedTelemetry,
            },
          }),
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
      const data = (await res.json()) as {
        reply: string;
        actions?: SpatialAction[];
        mode?: "gemini" | "local";
      };

      const actions = data.actions ?? [];
      if (actions.length > 0) {
        dispatchSpatialActions(actions);
      }

      addChatMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        actions,
        mode: data.mode ?? "local",
        timestamp: Date.now(),
      });
    } catch {
      addChatMessage({
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "Connection interrupted. Please try your command again.",
        mode: "local",
        timestamp: Date.now(),
      });
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 40);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <aside className="pointer-events-auto flex h-full w-80 max-w-[calc(100vw-24px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-violet-400/35 bg-slate-950/92 backdrop-blur-2xl shadow-2xl sm:w-[360px]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-gradient-to-r from-violet-950/60 to-sky-950/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/25 ring-1 ring-violet-400/50">
            <Bot className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">AI Spatial Mission Commander</div>
            <div className="font-mono text-[9px] text-violet-300">
              GEMINI TOOL-CALLING · LIVE 3D STEERING
            </div>
          </div>
        </div>
        <button
          onClick={() => setAiDrawerOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="Close AI Commander"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-3 py-2.5 leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-500/25 text-sky-50 ring-1 ring-sky-400/40"
                  : "border border-slate-800 bg-slate-900/90 text-slate-200"
              }`}
            >
              <FormattedMessage content={msg.content} />
            </div>

            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {msg.actions.map((act, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {formatActionChip(act)}
                  </span>
                ))}
              </div>
            )}

            {msg.role === "assistant" && msg.mode && (
              <span className="mt-1 font-mono text-[9px] uppercase text-slate-500">
                {msg.mode === "gemini" ? "Powered by Gemini API" : "Local Spatial Commander"}
              </span>
            )}
          </div>
        ))}

        {aiLoading && (
          <div className="flex items-center gap-2 text-violet-300">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span className="font-mono text-[11px]">Computing trajectory & briefing...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts (Clean Wrapped Grid — Zero Right-Edge Clipping!) */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-slate-800/80 bg-slate-950/60 px-3 py-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => void sendMessage(p)}
            disabled={aiLoading}
            className="rounded-full border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-[10px] text-slate-300 transition hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-white disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-950 p-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command camera or ask physics / bio / chem..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-400"
        />
        <button
          type="submit"
          disabled={aiLoading || !input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </aside>
  );
}
