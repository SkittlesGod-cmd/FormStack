"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Loader2, BookOpen, Target, Plus, Check, ChevronDown,
  Zap, BarChart3, FlaskConical, ShieldCheck, Link2, FileText,
  Info, Clock, X, ArrowRight, Copy, Bookmark, BookmarkCheck,
  ArrowLeftRight, RotateCcw, History, LayoutDashboard, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import type { Formulation } from "@/lib/formulations/types";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "ingredient" | "goal" | "compare";

interface HistoryEntry {
  id: string;
  query: string;
  mode: Mode;
  content: string;
  timestamp: number;
}

interface ParsedSection { heading: string; body: string; }
interface DoseRange { min: number; max: number; effective: number; unit: string; }

interface Slot {
  query: string;
  content: string;
  streaming: boolean;
  sections: ParsedSection[];
  grade: "A" | "B" | "C" | null;
  doseRange: DoseRange | null;
  synergies: string[];
  goalIngredients: string[];
  safetyScore: number;
  studyCount: number;
  bioScore: number;
  error: string | null;
}

const emptySlot = (): Slot => ({
  query: "", content: "", streaming: false, sections: [],
  grade: null, doseRange: null, synergies: [], goalIngredients: [],
  safetyScore: 0, studyCount: 0, bioScore: 0, error: null,
});

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let heading = "";
  let body: string[] = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (heading || body.some(l => l.trim())) sections.push({ heading, body: body.join("\n").trim() });
      heading = line.slice(3).trim();
      body = [];
    } else { body.push(line); }
  }
  if (heading || body.some(l => l.trim())) sections.push({ heading, body: body.join("\n").trim() });
  return sections.filter(s => s.body.length > 0);
}

function extractGrade(content: string): "A" | "B" | "C" | null {
  const src = content.match(/## Overview\n([\s\S]*?)(?=\n##|$)/i)?.[1] ?? content.slice(0, 800);
  for (const p of [/evidence (?:quality|grade)[^.]*\b([ABC])\b/i, /grade[:\s]+\*?\*?([ABC])\b/i]) {
    const m = src.match(p);
    if (m && ["A","B","C"].includes(m[1].toUpperCase())) return m[1].toUpperCase() as "A"|"B"|"C";
  }
  return null;
}

function extractDoseRange(content: string): DoseRange | null {
  const r = content.match(/Studied range[^:\n]*:\s*\*?\*?(\d[\d,]*)\s*[–\-]\s*(\d[\d,]*)\s*(mg|mcg|g|IU|CFU)/i);
  if (!r) return null;
  const e = content.match(/Most common effective dose[^:\n]*:\s*\*?\*?(\d[\d,]*)\s*(mg|mcg|g|IU|CFU)/i);
  return {
    min: parseInt(r[1].replace(/,/g,"")),
    max: parseInt(r[2].replace(/,/g,"")),
    effective: e ? parseInt(e[1].replace(/,/g,"")) : parseInt(r[2].replace(/,/g,"")),
    unit: r[3],
  };
}

function extractDoseSimple(content: string): { dose: string; unit: string } | null {
  const m = content.match(/Most common effective dose[^:\n]*:\s*\*?\*?([0-9][0-9,]*)\s*(mg|mcg|g|IU|CFU)/i)
    || content.match(/Studied range[^:\n]*:\s*\*?\*?([0-9][0-9,]*)\s*[–\-]/i);
  if (!m) return null;
  const u = content.match(/Studied range[^:\n]*:\s*\*?\*?[0-9–\-,\s]+(mg|mcg|g|IU|CFU)/i);
  return { dose: m[1].replace(/,/g,""), unit: m[2] ?? u?.[1] ?? "mg" };
}

function extractSynergies(content: string): string[] {
  const m = content.match(/## Synergies?[\s\S]*?\n([\s\S]*?)(?=\n## |$)/i);
  if (!m) return [];
  const bold = m[1].match(/\*\*([^*:—\n]{3,55}?)\*\*/g) ?? [];
  return [...new Set(bold.map(b => b.replace(/\*\*/g,"").split(":")[0].split("—")[0].trim()))].slice(0,6);
}

function extractGoalIngredients(content: string): string[] {
  const h3 = content.match(/^### (?:\d+\.\s+)?(.+)$/gm) ?? [];
  if (h3.length > 1) return h3.map(m => m.replace(/^### (?:\d+\.\s+)?/,"").trim()).slice(0,8);
  const bold = content.match(/^\d+\.\s+\*\*([^*]+)\*\*/gm) ?? [];
  return bold.map(m => m.replace(/^\d+\.\s+\*\*/,"").replace(/\*\*.*/,"").trim()).slice(0,8);
}

function extractSafetyScore(content: string): number {
  const src = content.match(/## Safety[\s\S]*?(?=\n## |$)/i)?.[0] ?? content;
  let score = 55;
  if (/well.tolerated/i.test(src))                                       score += 18;
  if (/generally safe/i.test(src))                                       score += 12;
  if (/no serious adverse/i.test(src))                                   score += 12;
  if (/adverse effects? (?:are |were )?(?:rare|minimal|mild)/i.test(src)) score += 8;
  if (/caution|monitor|elevated risk/i.test(src))                        score -= 15;
  if (/hepatotoxic|nephrotoxic/i.test(src))                              score -= 25;
  if (/contraindicated/i.test(src))                                      score -= 20;
  if (/drug interaction/i.test(src))                                     score -= 8;
  return Math.max(10, Math.min(95, score));
}

function extractStudyCount(content: string): number {
  const m = content.match(/(\d+)\s+(?:randomized |double.blind |placebo.controlled |human )*(?:studies|trials|RCTs|clinical trials)/gi) ?? [];
  const nums = m.map(x => parseInt(x.match(/\d+/)?.[0] ?? "0"));
  return nums.length ? Math.max(...nums) : 0;
}

function extractBioScore(content: string): number {
  if (/high.*bioavailability|excellent.*absorption|well.*absorbed/i.test(content)) return 85;
  if (/good.*bioavailability|enhanced.*absorption/i.test(content))                  return 70;
  if (/poor.*bioavailability|low.*absorption/i.test(content))                       return 30;
  if (/bioavailability/i.test(content))                                             return 55;
  return 50;
}

function gradeToScore(g: "A"|"B"|"C"|null): number {
  return g === "A" ? 92 : g === "B" ? 65 : g === "C" ? 38 : 50;
}

function studyCountToScore(n: number): number {
  return Math.min(95, Math.round(10 + n * 4.2));
}

function synergyCountToScore(n: number): number {
  return Math.min(95, 15 + n * 14);
}

// ─── Visualization components ─────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

const RADAR_AXES = ["Evidence", "Safety", "Research\nDepth", "Bioavail.", "Synergy"];
const RADAR_SIZE = 220;
const RADAR_CX = 110;
const RADAR_CY = 108;
const RADAR_R  = 72;

function radarVertex(i: number, scale: number): [number, number] {
  const angle = (Math.PI * 2 * i) / RADAR_AXES.length - Math.PI / 2;
  return [RADAR_CX + RADAR_R * scale * Math.cos(angle), RADAR_CY + RADAR_R * scale * Math.sin(angle)];
}

function radarPath(vals: number[]): string {
  const pts = vals.map((v, i) => radarVertex(i, v / 100));
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ") + "Z";
}

function RadarChart({ a, b, labelA, labelB }: {
  a: number[]; b: number[]; labelA: string; labelB: string;
}) {
  const gridLevels = [0.25, 0.5, 0.75, 1];
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="overflow-visible">
        {/* Grid rings */}
        {gridLevels.map(level => (
          <polygon key={level}
            points={RADAR_AXES.map((_, i) => radarVertex(i, level).join(",")).join(" ")}
            fill="none" stroke="#e5e7eb" strokeWidth="1"
          />
        ))}
        {/* Axis lines + labels */}
        {RADAR_AXES.map((label, i) => {
          const [x1, y1] = radarVertex(i, 0);
          const [x2, y2] = radarVertex(i, 1);
          const [lx, ly] = radarVertex(i, 1.28);
          const lines = label.split("\n");
          return (
            <g key={label}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth="1" />
              {lines.map((l, li) => (
                <text key={li} x={lx} y={ly + li * 9} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: 8.5, fill: "#9ca3af", fontFamily: "inherit" }}>
                  {l}
                </text>
              ))}
            </g>
          );
        })}
        {/* Data area A */}
        <path d={radarPath(a)} fill="#5b6ee1" fillOpacity={0.18} stroke="#5b6ee1" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Data area B */}
        <path d={radarPath(b)} fill="#9333ea" fillOpacity={0.14} stroke="#9333ea" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Dots A */}
        {a.map((v, i) => { const [x, y] = radarVertex(i, v / 100); return <circle key={i} cx={x} cy={y} r={3.5} fill="#5b6ee1" stroke="white" strokeWidth="1.5" />; })}
        {/* Dots B */}
        {b.map((v, i) => { const [x, y] = radarVertex(i, v / 100); return <circle key={i} cx={x} cy={y} r={3.5} fill="#9333ea" stroke="white" strokeWidth="1.5" />; })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-brand" />
          <span className="text-gray-600 font-medium">{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-purple-500" />
          <span className="text-gray-600 font-medium">{labelB}</span>
        </div>
      </div>
    </div>
  );
}

function DoseCompareChart({ a, b, labelA, labelB }: {
  a: DoseRange; b: DoseRange; labelA: string; labelB: string;
}) {
  const sameUnit = a.unit === b.unit;
  const maxVal   = Math.max(a.max, b.max);
  const pct = (v: number) => `${((v / maxVal) * 100).toFixed(1)}%`;

  const bars = [
    { range: a, label: labelA, letter: "A", rangeCls: "bg-brand/20", dotCls: "bg-brand", textCls: "text-brand" },
    { range: b, label: labelB, letter: "B", rangeCls: "bg-purple-200",  dotCls: "bg-purple-500", textCls: "text-purple-600" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Dose Range Comparison</p>
      {bars.map(({ range, label, letter, rangeCls, dotCls, textCls }) => (
        <div key={letter}>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", letter === "A" ? "bg-brand/10 text-brand" : "bg-purple-100 text-purple-600")}>{letter}</span>
              <span className="text-[12px] font-semibold text-gray-800">{label}</span>
            </div>
            <span className={cn("text-[12px] font-bold", textCls)}>{range.effective} {range.unit}</span>
          </div>
          <div className="relative h-6 rounded-full bg-gray-100">
            <div className={cn("absolute inset-y-1 rounded-full", rangeCls)}
              style={{ left: pct(range.min), width: `calc(${pct(range.max - range.min)} - 0px)` }} />
            <div className={cn("absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm", dotCls)}
              style={{ left: pct(range.effective) }} />
            <div className="absolute left-0 top-full mt-0.5 text-[9px] text-gray-400">{range.min}</div>
            <div className="absolute right-0 top-full mt-0.5 text-right text-[9px] text-gray-400">{range.max} {range.unit}</div>
          </div>
        </div>
      ))}
      {!sameUnit && (
        <p className="text-[11px] italic text-gray-400">Note: units differ ({a.unit} vs {b.unit}); bars scaled independently per row.</p>
      )}
    </div>
  );
}

function SafetyGauge({ score }: { score: number }) {
  const r = 38;
  const cx = 50; const cy = 52;
  const START = -210; const SWEEP = 240;
  function pt(deg: number): [number, number] {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function arc(s: number, e: number): string {
    const [x1, y1] = pt(s); const [x2, y2] = pt(e);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${e - s > 180 ? 1 : 0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  const fillEnd = START + SWEEP * (score / 100);
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "High" : score >= 45 ? "Moderate" : "Low";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="76" viewBox="0 0 100 76">
        <path d={arc(START, START + SWEEP)} fill="none" stroke="#e5e7eb" strokeWidth="9" strokeLinecap="round" />
        {score > 0 && <path d={arc(START, fillEnd)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />}
        <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: color, fontFamily: "inherit" }}>{score}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" style={{ fontSize: 7.5, fill: "#9ca3af", fontFamily: "inherit" }}>/ 100</text>
      </svg>
      <div className="text-center">
        <p className="text-[10px] font-semibold" style={{ color }}>{label} safety</p>
      </div>
    </div>
  );
}

function CompareScoreTable({ a, b, axes }: {
  a: number[]; b: number[]; axes: string[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-black/[0.05] bg-gray-50">
            <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Dimension</th>
            <th className="px-4 py-2.5 text-left font-semibold text-brand">A</th>
            <th className="px-4 py-2.5 text-left font-semibold text-purple-600">B</th>
          </tr>
        </thead>
        <tbody>
          {axes.map((axis, i) => {
            const aVal = a[i]; const bVal = b[i];
            const winner = aVal > bVal ? "a" : bVal > aVal ? "b" : "tie";
            return (
              <tr key={axis} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 font-medium text-gray-600">{axis}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-8 font-semibold", winner === "a" ? "text-brand" : "text-gray-500")}>{aVal}</span>
                    <div className="flex-1"><ScoreBar value={aVal} color={winner === "a" ? "#5b6ee1" : "#d1d5db"} /></div>
                    {winner === "a" && <span className="text-[9px] font-bold text-brand">▲</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-8 font-semibold", winner === "b" ? "text-purple-600" : "text-gray-500")}>{bVal}</span>
                    <div className="flex-1"><ScoreBar value={bVal} color={winner === "b" ? "#9333ea" : "#d1d5db"} /></div>
                    {winner === "b" && <span className="text-[9px] font-bold text-purple-600">▲</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const CHARTS_TAB = "__charts__";

// ─── Sub-components ───────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { label: "Grade A", desc: "Strong clinical evidence", cls: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  B: { label: "Grade B", desc: "Moderate evidence",       cls: "bg-amber-50 border-amber-100 text-amber-700" },
  C: { label: "Grade C", desc: "Emerging / limited",      cls: "bg-gray-50 border-gray-200 text-gray-600" },
};

function GradeBadge({ grade }: { grade: "A"|"B"|"C" }) {
  const { label, desc, cls } = GRADE_CONFIG[grade];
  return (
    <span title={desc} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function DoseViz({ range }: { range: DoseRange }) {
  const total = range.max - range.min;
  const pct = total > 0 ? ((range.effective - range.min) / total) * 100 : 50;
  const clamped = Math.max(4, Math.min(96, pct));
  return (
    <div className="mt-5 rounded-xl border border-brand/15 bg-brand/[0.03] p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-brand/60">Dose range</p>
      <div className="relative h-2 rounded-full bg-brand/10">
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand/25" style={{ width: `${clamped}%` }} />
        <div
          className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-brand shadow-sm shadow-brand/20"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-end justify-between text-[11px]">
        <div><p className="text-gray-400">Min</p><p className="font-semibold text-gray-700">{range.min} {range.unit}</p></div>
        <div className="text-center">
          <p className="text-brand/60">Most effective</p>
          <p className="text-[15px] font-bold text-brand">{range.effective} {range.unit}</p>
        </div>
        <div className="text-right"><p className="text-gray-400">Max</p><p className="font-semibold text-gray-700">{range.max} {range.unit}</p></div>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      className="rounded p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600" title="Copy">
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2.5">
          <div className="h-3 w-32 rounded-full bg-gray-100" />
          <div className="h-2.5 w-full rounded-full bg-gray-100" />
          <div className="h-2.5 w-5/6 rounded-full bg-gray-100" />
          <div className="h-2.5 w-4/6 rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

const SECTION_CFG: Record<string, { icon: LucideIcon; iconCls: string }> = {
  "Overview":                   { icon: Info,          iconCls: "text-gray-500 bg-gray-100" },
  "Mechanisms of Action":       { icon: Zap,           iconCls: "text-purple-600 bg-purple-50" },
  "Clinical Evidence":          { icon: BarChart3,     iconCls: "text-emerald-600 bg-emerald-50" },
  "Evidence-Backed Dose Range": { icon: FlaskConical,  iconCls: "text-brand bg-brand/10" },
  "Safety & Tolerability":      { icon: ShieldCheck,   iconCls: "text-amber-600 bg-amber-50" },
  "Synergies":                  { icon: Link2,         iconCls: "text-indigo-600 bg-indigo-50" },
  "FDA Compliance Notes":       { icon: FileText,      iconCls: "text-orange-600 bg-orange-50" },
};

function getSectionCfg(heading: string) {
  const key = Object.keys(SECTION_CFG).find(k =>
    heading.toLowerCase().startsWith(k.toLowerCase().split(" ").slice(0,2).join(" ").toLowerCase())
  );
  return SECTION_CFG[key ?? ""] ?? { icon: BookOpen as LucideIcon, iconCls: "text-gray-500 bg-gray-100" };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = "fl_research_history";
const PINNED_KEY  = "fl_research_pinned";
const UNIT_OPTIONS = ["mg", "mcg", "g", "IU", "CFU", "mL", "%DV"];

const EXAMPLES_INGREDIENT = [
  "L-Theanine", "Ashwagandha KSM-66", "Lion's Mane", "Creatine Monohydrate",
  "Magnesium Glycinate", "Vitamin D3 + K2", "Rhodiola Rosea", "Berberine",
  "Alpha GPC", "Coenzyme Q10", "NMN", "Quercetin + Bromelain",
];
const EXAMPLES_GOAL = [
  "Cognitive performance and focus", "Sleep quality and recovery",
  "Athletic endurance", "Stress and cortisol management",
  "Gut health and microbiome", "Longevity and cellular health",
];
const EXAMPLES_COMPARE = [
  ["L-Theanine", "Ashwagandha"], ["Creatine", "Beta-Alanine"],
  ["Magnesium Glycinate", "Magnesium Malate"], ["Lion's Mane", "Bacopa Monnieri"],
];

const RADAR_AXIS_LABELS = ["Evidence", "Safety", "Research Depth", "Bioavailability", "Synergy"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [mode, setMode] = useState<Mode>("ingredient");
  const [query, setQuery] = useState("");
  const [compareQuery, setCompareQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [main, setMain]       = useState<Slot>(emptySlot());
  const [compare, setCompare] = useState<Slot>(emptySlot());

  const mainAbortRef    = useRef<AbortController | null>(null);
  const compareAbortRef = useRef<AbortController | null>(null);
  const searchRef       = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pinned,  setPinned]  = useState<HistoryEntry[]>([]);

  // Add-to-formulation
  const [formulations, setFormulations]         = useState<Formulation[]>([]);
  const [addOpen, setAddOpen]                   = useState(false);
  const [addDose, setAddDose]                   = useState("");
  const [addUnit, setAddUnit]                   = useState("mg");
  const [addFormulationId, setAddFormulationId] = useState("");
  const [adding, setAdding]                     = useState(false);
  const [addSuccess, setAddSuccess]             = useState(false);
  const [addedId, setAddedId]                   = useState<string | null>(null);
  const [addError, setAddError]                 = useState<string | null>(null);
  const [formulationsLoaded, setFormulationsLoaded] = useState(false);

  useEffect(() => {
    try {
      const h = localStorage.getItem(HISTORY_KEY); if (h) setHistory(JSON.parse(h));
      const p = localStorage.getItem(PINNED_KEY);  if (p) setPinned(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => {
    if (main.sections.length > 0) setActiveSection(s => s || main.sections[0].heading);
  }, [main.sections]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  function saveHistory(entry: HistoryEntry) {
    setHistory(prev => {
      const next = [entry, ...prev.filter(h => !(h.query === entry.query && h.mode === entry.mode))].slice(0,10);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function togglePin(entry: HistoryEntry) {
    setPinned(prev => {
      const next = prev.some(p => p.id === entry.id)
        ? prev.filter(p => p.id !== entry.id)
        : [entry, ...prev].slice(0,5);
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function restoreEntry(entry: HistoryEntry) {
    setQuery(entry.query);
    setMode(entry.mode === "compare" ? "ingredient" : entry.mode);
    setHasSearched(true);
    setActiveSection("");
    setAddOpen(false);
    setShowHistory(false);
    const sections = parseSections(entry.content);
    const acc = entry.content;
    setMain({ query: entry.query, content: acc, streaming: false, sections,
      grade: extractGrade(acc), doseRange: extractDoseRange(acc),
      synergies: extractSynergies(acc), goalIngredients: extractGoalIngredients(acc),
      safetyScore: extractSafetyScore(acc), studyCount: extractStudyCount(acc),
      bioScore: extractBioScore(acc), error: null });
    setCompare(emptySlot());
  }

  async function runSlot(which: "main" | "compare", sq: string, sm: Mode) {
    const abortRef = which === "main" ? mainAbortRef : compareAbortRef;
    const setSlot  = which === "main" ? setMain : setCompare;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setSlot(s => ({ ...s, query: sq, streaming: true, content: "", sections: [],
      grade: null, doseRange: null, synergies: [], goalIngredients: [],
      safetyScore: 0, studyCount: 0, bioScore: 0, error: null }));

    let acc = "";
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sq, type: sm === "compare" ? "ingredient" : sm }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error ?? `Error ${res.status}`);
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setSlot(s => ({ ...s, content: acc }));
      }
      const sections = parseSections(acc);
      if (which === "main") {
        const d = extractDoseSimple(acc);
        if (d) { setAddDose(d.dose); setAddUnit(d.unit); }
      }
      setSlot(s => ({ ...s, streaming: false, sections,
        grade: extractGrade(acc), doseRange: extractDoseRange(acc),
        synergies: sm !== "goal" ? extractSynergies(acc) : [],
        goalIngredients: sm === "goal" ? extractGoalIngredients(acc) : [],
        safetyScore: extractSafetyScore(acc),
        studyCount: extractStudyCount(acc),
        bioScore: extractBioScore(acc) }));
      saveHistory({ id: crypto.randomUUID(), query: sq, mode: sm, content: acc, timestamp: Date.now() });
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setSlot(s => ({ ...s, streaming: false, error: getErrorMessage(e, "Research failed") }));
      } else {
        setSlot(s => ({ ...s, streaming: false }));
      }
    }
  }

  function handleSearch(q?: string, m?: Mode) {
    const sq = (q ?? query).trim();
    const sm = m ?? mode;
    if (!sq) return;
    if (q) setQuery(q);
    if (m && m !== "compare") setMode(m);
    setHasSearched(true);
    setActiveSection("");
    setAddOpen(false);
    setAddSuccess(false);
    setAddedId(null);
    setCompare(emptySlot());
    runSlot("main", sq, sm);
  }

  function handleCompare() {
    const a = query.trim(); const b = compareQuery.trim();
    if (!a || !b) return;
    setHasSearched(true);
    setActiveSection("");
    setAddOpen(false);
    runSlot("main",    a, "compare");
    runSlot("compare", b, "compare");
  }

  function resetSearch() {
    mainAbortRef.current?.abort();
    compareAbortRef.current?.abort();
    setHasSearched(false);
    setMain(emptySlot());
    setCompare(emptySlot());
    setActiveSection("");
    setAddOpen(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  async function loadFormulations() {
    if (formulationsLoaded) return;
    try {
      const res = await fetch("/api/formulations");
      if (!res.ok) return;
      const json = await res.json();
      setFormulations(json.formulations ?? []);
      if ((json.formulations ?? []).length > 0) setAddFormulationId(json.formulations[0].id);
      setFormulationsLoaded(true);
    } catch {}
  }

  async function handleAdd() {
    if (!addFormulationId || adding) return;
    setAdding(true); setAddError(null);
    const f = formulations.find(x => x.id === addFormulationId);
    if (!f) { setAdding(false); return; }
    const updated = [...(f.ingredients ?? []), { id: crypto.randomUUID(), name: main.query, dose: addDose, unit: addUnit }];
    try {
      const res = await fetch(`/api/formulations/${addFormulationId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAddSuccess(true); setAddedId(addFormulationId);
    } catch (e) { setAddError(getErrorMessage(e, "Failed to add")); }
    finally { setAdding(false); }
  }

  // Section tabs = union of A + B sections, plus Charts tab in compare mode
  const isCompareMode = mode === "compare" && (compare.content || compare.streaming);
  const isStreaming   = main.streaming || compare.streaming;
  const hasResults    = main.content || main.error;

  const compareDone = !main.streaming && !compare.streaming && main.content && compare.content;

  const allSectionHeadings: string[] = [
    ...(isCompareMode && compareDone ? [CHARTS_TAB] : []),
    ...main.sections.map(s => s.heading),
    ...compare.sections.filter(s => !main.sections.some(m => m.heading === s.heading)).map(s => s.heading),
  ];

  const isPinned         = pinned.some(p => p.query === main.query && p.content === main.content);
  const currentHistEntry = history.find(h => h.query === main.query);

  // Radar scores
  const radarA = [
    gradeToScore(main.grade),
    main.safetyScore,
    studyCountToScore(main.studyCount),
    main.bioScore,
    synergyCountToScore(main.synergies.length),
  ];
  const radarB = [
    gradeToScore(compare.grade),
    compare.safetyScore,
    studyCountToScore(compare.studyCount),
    compare.bioScore,
    synergyCountToScore(compare.synergies.length),
  ];

  // ── Pre-search hero ──────────────────────────────────────────────────────────
  if (!hasSearched) {
    const examples = mode === "ingredient" ? EXAMPLES_INGREDIENT : mode === "goal" ? EXAMPLES_GOAL : [];
    return (
      <div className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">

          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-3.5 py-1.5">
              <BookOpen className="size-3.5 text-brand" />
              <span className="text-[12px] font-semibold text-brand">AI Research</span>
            </div>
            <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-gray-950 leading-tight">
              Clinical evidence on demand.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
              Mechanisms, RCT-backed dose ranges, safety data, synergies,<br className="hidden sm:block" />
              and FDA claim language — in seconds, not hours.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="flex rounded-xl bg-gray-100 p-1 text-[13px]">
              {(["ingredient", "goal", "compare"] as const).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium capitalize transition",
                    mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}>
                  {m === "ingredient" && <BookOpen className="size-3.5" />}
                  {m === "goal"       && <Target className="size-3.5" />}
                  {m === "compare"    && <ArrowLeftRight className="size-3.5" />}
                  {m === "ingredient" ? "Ingredient" : m === "goal" ? "Health goal" : "Compare two"}
                </button>
              ))}
            </div>
          </div>

          {mode !== "compare" ? (
            <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={mode === "ingredient" ? "Search an ingredient — e.g. Ashwagandha KSM-66, Creatine, Alpha GPC…" : "Search a health goal — e.g. Sleep quality, Cognitive performance…"}
                className="h-14 w-full rounded-2xl border border-black/[0.10] bg-white pl-11 pr-36 text-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <button type="submit" disabled={!query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-xl bg-gray-950 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40">
                <Search className="size-3.5" /> Research
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">A</span>
                  <input ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. L-Theanine"
                    className="h-12 w-full rounded-xl border border-brand/20 bg-white pl-10 pr-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-600">B</span>
                  <input type="text" value={compareQuery} onChange={e => setCompareQuery(e.target.value)}
                    placeholder="e.g. Caffeine"
                    className="h-12 w-full rounded-xl border border-purple-200 bg-white pl-10 pr-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                </div>
              </div>
              <button type="button" onClick={handleCompare} disabled={!query.trim() || !compareQuery.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 py-3 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40">
                <ArrowLeftRight className="size-3.5" /> Compare both
              </button>
              <div className="space-y-1.5">
                <p className="text-center text-[11px] text-gray-400">Try a comparison</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLES_COMPARE.map(([a, b]) => (
                    <button key={`${a}-${b}`} type="button" onClick={() => { setQuery(a); setCompareQuery(b); }}
                      className="rounded-full border border-black/[0.07] bg-white px-3 py-1 text-[11px] text-gray-600 transition hover:border-brand/30 hover:text-brand">
                      {a} vs {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode !== "compare" && (
            <div className="space-y-2">
              <p className="text-center text-[11px] text-gray-400">Or pick an example</p>
              <div className="flex flex-wrap justify-center gap-2">
                {examples.map(ex => (
                  <button key={ex} type="button" onClick={() => handleSearch(ex)}
                    className="rounded-full border border-black/[0.07] bg-white px-3.5 py-1.5 text-[12px] text-gray-600 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition hover:border-brand/30 hover:bg-brand/[0.03] hover:text-brand">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="border-t border-black/[0.05] pt-5">
              <p className="mb-2 text-center text-[11px] text-gray-400">Recent</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {history.slice(0, 6).map(entry => (
                  <button key={entry.id} type="button" onClick={() => restoreEntry(entry)}
                    className="flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-3 py-1 text-[11px] text-gray-500 transition hover:text-gray-900">
                    <Clock className="size-3 opacity-50" />
                    {entry.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Post-search view ─────────────────────────────────────────────────────────
  const activeSectionData  = main.sections.find(s => s.heading === activeSection);
  const compareSectionData = compare.sections.find(s => s.heading === activeSection);

  return (
    <div className="space-y-0">

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex flex-1 min-w-0 items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search ingredient or goal…"
              className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </div>
          {mode === "compare" && (
            <div className="relative">
              <input type="text" value={compareQuery} onChange={e => setCompareQuery(e.target.value)}
                placeholder="Compare with…"
                className="h-9 w-36 rounded-lg border border-purple-200 bg-white px-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
            </div>
          )}
          <button type="submit" disabled={isStreaming}
            onClick={mode === "compare" ? e => { e.preventDefault(); handleCompare(); } : undefined}
            className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40 shrink-0">
            {isStreaming ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
          </button>
        </form>

        <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5 text-[11px]">
          {(["ingredient","goal","compare"] as const).map(m => (
            <button key={m} type="button"
              onClick={() => { setMode(m); if (m !== "compare") { setCompare(emptySlot()); } }}
              className={cn("rounded-md px-2.5 py-1.5 font-medium capitalize transition",
                mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}>
              {m === "ingredient" ? "Ingredient" : m === "goal" ? "Goal" : "Compare"}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <button type="button" onClick={() => setShowHistory(v => !v)}
            className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition",
              showHistory ? "border-brand/20 bg-brand/[0.04] text-brand" : "border-black/[0.08] bg-white text-gray-500 hover:text-gray-800"
            )}>
            <History className="size-3.5" />
          </button>
          {showHistory && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)} />
              <div className="absolute right-0 z-20 mt-1.5 w-64 rounded-xl border border-black/[0.08] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
                <div className="border-b border-black/[0.05] px-3 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent</p>
                </div>
                {history.length === 0 ? (
                  <p className="px-3 py-3 text-[12px] text-gray-400">No history yet.</p>
                ) : history.map(entry => (
                  <button key={entry.id} type="button" onClick={() => restoreEntry(entry)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-gray-700 transition hover:bg-gray-50">
                    <BookOpen className="size-3 shrink-0 text-gray-300" />
                    <span className="truncate">{entry.query}</span>
                  </button>
                ))}
                {history.length > 0 && (
                  <button type="button"
                    onClick={() => { setHistory([]); try { localStorage.removeItem(HISTORY_KEY); } catch {} setShowHistory(false); }}
                    className="w-full border-t border-black/[0.05] px-3 py-2 text-left text-[11px] text-gray-400 hover:text-gray-600">
                    Clear history
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <button type="button" onClick={resetSearch}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-500 transition hover:text-gray-800">
          <RotateCcw className="size-3.5" /> New
        </button>
      </div>

      {/* ── RESULT HEADER ─────────────────────────────────────────────────── */}
      {(main.content || main.streaming || main.error) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            {isCompareMode ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">A</span>
                  <span className="text-[15px] font-semibold text-gray-950">{main.query}</span>
                  {main.grade && <GradeBadge grade={main.grade} />}
                </div>
                <span className="text-gray-300">vs</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">B</span>
                  <span className="text-[15px] font-semibold text-gray-950">{compare.query || compareQuery}</span>
                  {compare.grade && <GradeBadge grade={compare.grade} />}
                </div>
              </>
            ) : (
              <>
                <span className="text-[17px] font-semibold text-gray-950">{main.query}</span>
                {main.grade && !main.streaming && <GradeBadge grade={main.grade} />}
                {main.streaming && (
                  <span className="flex items-center gap-1.5 text-[12px] text-brand">
                    <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Analyzing…
                  </span>
                )}
              </>
            )}
          </div>
          {!isStreaming && main.content && (
            <div className="flex items-center gap-2">
              <CopyBtn text={main.content} />
              <button type="button"
                onClick={() => { if (currentHistEntry) togglePin(currentHistEntry); }}
                className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition",
                  isPinned ? "border-brand/20 bg-brand/[0.04] text-brand" : "border-black/[0.08] text-gray-500 hover:text-gray-800"
                )}>
                {isPinned ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
                {isPinned ? "Pinned" : "Pin"}
              </button>
              {mode !== "goal" && (
                <button type="button"
                  onClick={() => { setAddOpen(v => !v); setAddSuccess(false); setAddedId(null); setAddError(null); loadFormulations(); }}
                  className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/[0.08]">
                  <Plus className="size-3.5" /> Add to formulation
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ADD PANEL ─────────────────────────────────────────────────────── */}
      {addOpen && !isStreaming && (
        <div className="mb-4 rounded-xl border border-black/[0.06] bg-gray-50/60 px-5 py-4">
          {addSuccess ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-emerald-600">
              <Check className="size-4 shrink-0" />
              <span>Added to formulation.</span>
              {addedId && <a href={`/dashboard/formulations/${addedId}`} className="font-medium underline underline-offset-2 hover:text-emerald-700">Open formulation →</a>}
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <p className="w-full text-[12px] font-semibold text-gray-700">Add <span className="text-brand">{main.query}</span> to a formulation</p>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500">Formulation</label>
                {formulations.length === 0
                  ? <p className="text-[12px] italic text-gray-400">No formulations yet.</p>
                  : <div className="relative">
                      <select value={addFormulationId} onChange={e => setAddFormulationId(e.target.value)}
                        className="h-9 min-w-[180px] appearance-none rounded-lg border border-black/[0.08] bg-white pl-3 pr-8 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
                        {formulations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                    </div>
                }
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500">
                  Dose {addDose && <span className="text-emerald-600">(from research)</span>}
                </label>
                <input type="text" value={addDose} onChange={e => setAddDose(e.target.value)} placeholder="e.g. 300"
                  className="h-9 w-24 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-500">Unit</label>
                <select value={addUnit} onChange={e => setAddUnit(e.target.value)}
                  className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15">
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleAdd} disabled={adding || formulations.length === 0}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-gray-950 px-4 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40">
                {adding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                {adding ? "Adding…" : "Add"}
              </button>
            </div>
          )}
          {addError && <p className="mt-2 text-[12px] text-red-500">{addError}</p>}
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {main.error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[13px] font-medium text-red-700">Research failed</p>
          <p className="mt-1 text-[12px] text-red-500">{main.error.includes("API key") ? "AI research is temporarily unavailable." : main.error}</p>
        </div>
      )}

      {/* ── STREAMING VIEW ────────────────────────────────────────────────── */}
      {isStreaming && (
        <div className={cn("grid gap-4", isCompareMode ? "grid-cols-2" : "grid-cols-1")}>
          {[{ slot: main, label: "A", accent: "brand" }, { slot: compare, label: "B", accent: "purple" }]
            .filter((_, i) => i === 0 || isCompareMode)
            .map(({ slot, label, accent }) => (
              slot.streaming || slot.content ? (
                <div key={label} className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  {isCompareMode && (
                    <div className={cn("mb-4 flex items-center gap-2", accent === "brand" ? "text-brand" : "text-purple-600")}>
                      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", accent === "brand" ? "bg-brand/10" : "bg-purple-100")}>{label}</span>
                      <span className="text-[13px] font-semibold">{slot.query}</span>
                      {slot.streaming && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
                    </div>
                  )}
                  {slot.content ? <StreamingMarkdown content={slot.content} /> : <Skeleton />}
                </div>
              ) : null
            ))}
        </div>
      )}

      {/* ── SECTION TABS + CONTENT ────────────────────────────────────────── */}
      {!isStreaming && allSectionHeadings.length > 0 && (
        <>
          {/* Tab bar */}
          <div className="mb-4 flex gap-0.5 overflow-x-auto rounded-xl border border-black/[0.06] bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            {allSectionHeadings.map(heading => {
              const isCharts = heading === CHARTS_TAB;
              const { icon: Icon, iconCls } = isCharts
                ? { icon: LayoutDashboard as LucideIcon, iconCls: "text-brand bg-brand/10" }
                : getSectionCfg(heading);
              const isActive = activeSection === heading;
              return (
                <button key={heading} type="button" onClick={() => setActiveSection(heading)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium whitespace-nowrap transition",
                    isActive ? "bg-gray-950 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  )}>
                  <span className={cn("flex size-5 items-center justify-center rounded-md", isActive ? "bg-white/10" : iconCls)}>
                    <Icon className="size-3" />
                  </span>
                  {isCharts ? "Charts" : heading}
                </button>
              );
            })}
          </div>

          {/* ── CHARTS TAB ───────────────────────────────────────────────── */}
          {activeSection === CHARTS_TAB && (
            <div className="space-y-4">
              {/* Radar + Score table */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Capability Radar</p>
                  <div className="flex justify-center">
                    <RadarChart a={radarA} b={radarB} labelA={main.query} labelB={compare.query} />
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Score Breakdown</p>
                  <CompareScoreTable
                    axes={RADAR_AXIS_LABELS}
                    a={radarA.map(Math.round)}
                    b={radarB.map(Math.round)}
                  />
                </div>
              </div>

              {/* Dose comparison chart */}
              {main.doseRange && compare.doseRange ? (
                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <DoseCompareChart
                    a={main.doseRange} b={compare.doseRange}
                    labelA={main.query} labelB={compare.query}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-black/[0.05] bg-gray-50 px-6 py-5 text-[13px] text-gray-400 italic">
                  Dose comparison unavailable — dose data not detected in one or both results.
                </div>
              )}

              {/* Safety gauges */}
              {(main.safetyScore > 0 || compare.safetyScore > 0) && (
                <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Safety Profile</p>
                  <div className="flex flex-wrap justify-around gap-6">
                    {[{ slot: main, letter: "A", labelCls: "bg-brand/10 text-brand" },
                      { slot: compare, letter: "B", labelCls: "bg-purple-100 text-purple-600" }].map(({ slot, letter, labelCls }) => (
                      <div key={letter} className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", labelCls)}>{letter}</span>
                          <span className="text-[12px] font-semibold text-gray-700">{slot.query}</span>
                        </div>
                        <SafetyGauge score={slot.safetyScore} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMPARE MODE: same section two columns ───────────────────── */}
          {activeSection !== CHARTS_TAB && isCompareMode && (
            <div className="grid grid-cols-2 gap-4">
              {[{ slot: main, label: "A", labelCls: "bg-brand/10 text-brand" },
                { slot: compare, label: "B", labelCls: "bg-purple-100 text-purple-600" }].map(({ slot, label, labelCls }) => {
                const section = slot.sections.find(s => s.heading === activeSection);
                return (
                  <div key={label} className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", labelCls)}>{label}</span>
                        <span className="text-[13px] font-semibold text-gray-800">{slot.query}</span>
                        {slot.grade && <GradeBadge grade={slot.grade} />}
                      </div>
                      {section && <CopyBtn text={section.body} />}
                    </div>
                    {section ? (
                      <>
                        <StreamingMarkdown content={section.body} />
                        {activeSection.includes("Dose") && slot.doseRange && <DoseViz range={slot.doseRange} />}
                        {activeSection.includes("Safety") && slot.safetyScore > 0 && (
                          <div className="mt-4 flex justify-center border-t border-black/[0.05] pt-4">
                            <SafetyGauge score={slot.safetyScore} />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[13px] italic text-gray-400">Section not available.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SINGLE RESULT: full width ─────────────────────────────────── */}
          {activeSection !== CHARTS_TAB && !isCompareMode && activeSectionData && (
            <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => { const { icon: Icon, iconCls } = getSectionCfg(activeSection); return (
                    <div className={cn("flex size-7 items-center justify-center rounded-lg", iconCls)}>
                      <Icon className="size-3.5" />
                    </div>
                  ); })()}
                  <h2 className="text-[14px] font-semibold text-gray-900">{activeSection}</h2>
                </div>
                <CopyBtn text={activeSectionData.body} />
              </div>

              <StreamingMarkdown content={activeSectionData.body} />

              {activeSection.includes("Dose") && main.doseRange && <DoseViz range={main.doseRange} />}

              {activeSection.includes("Safety") && main.safetyScore > 0 && (
                <div className="mt-5 flex items-center gap-8 border-t border-black/[0.05] pt-5">
                  <SafetyGauge score={main.safetyScore} />
                  <div className="flex-1 space-y-3 text-[12px] text-gray-500">
                    <p>Score derived from safety language in the AI analysis above. Scores above 70 indicate a well-tolerated, low-risk profile.</p>
                  </div>
                </div>
              )}

              {activeSection.includes("Synerg") && main.synergies.length > 0 && (
                <div className="mt-5 border-t border-black/[0.05] pt-5">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quick-research a synergy</p>
                  <div className="flex flex-wrap gap-2">
                    {main.synergies.map(s => (
                      <button key={s} type="button" onClick={() => handleSearch(s, "ingredient")}
                        className="flex items-center gap-1 rounded-full border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/10">
                        {s} <ArrowRight className="size-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "goal" && main.goalIngredients.length > 0 && (
                <div className="mt-5 border-t border-black/[0.05] pt-5">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Research individual ingredients</p>
                  <div className="flex flex-wrap gap-2">
                    {main.goalIngredients.map(name => (
                      <button key={name} type="button" onClick={() => handleSearch(name, "ingredient")}
                        className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-brand/30 hover:text-brand">
                        <BookOpen className="size-3" /> {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
