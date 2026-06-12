"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { compressImage, getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";
import {
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Code,
  FileCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ScanSearch,
  Layers3,
  ShieldCheck,
  Gauge,
  Braces,
  MonitorPlay,
  Cloud,
  ArrowRight,
  Zap,
} from "lucide-react";

type Step = "upload" | "uploading" | "analyzing" | "generating" | "saving" | "done" | "error";

const progressStepOrder: Step[] = ["uploading", "analyzing", "generating", "saving"];

const progressPercentRanges: Record<Exclude<Step, "upload" | "done" | "error">, [number, number]> = {
  uploading: [8, 26],
  analyzing: [28, 48],
  generating: [50, 88],
  saving: [90, 97],
};

const generationStages = [
  "Reading sketch hierarchy",
  "Detecting layout blocks",
  "Naming components",
  "Writing semantic markup",
  "Applying responsive styles",
  "Preparing preview files",
];

const liveCodeSnippets: Record<"react-tailwind" | "html-css", string[]> = {
  "react-tailwind": [
    "export default function App() {",
    "  return (",
    "    <main className=\"min-h-screen bg-slate-950 text-white\">",
    "      <section className=\"mx-auto max-w-7xl px-6 py-12\">",
    "        <header className=\"flex items-center justify-between\">",
    "          <h1 className=\"text-4xl font-black tracking-tight\">Generated Interface</h1>",
    "          <button className=\"rounded-2xl bg-blue-500 px-5 py-3\">Action</button>",
    "        </header>",
    "        <div className=\"mt-8 grid gap-4 md:grid-cols-3\">",
    "          <article className=\"rounded-3xl border border-white/10 p-6\">",
    "            <h2 className=\"font-bold\">Sketch section</h2>",
    "            <p className=\"mt-2 text-sm text-slate-300\">AI maps your drawing into components.</p>",
    "          </article>",
    "        </div>",
    "      </section>",
    "    </main>",
    "  );",
    "}",
  ],
  "html-css": [
    "<main class=\"page-shell\">",
    "  <section class=\"hero-section\">",
    "    <nav class=\"topbar\">",
    "      <strong>Generated Interface</strong>",
    "      <button>Action</button>",
    "    </nav>",
    "    <div class=\"bento-grid\">",
    "      <article class=\"panel-card\">",
    "        <h2>Sketch section</h2>",
    "        <p>AI maps your drawing into clean frontend code.</p>",
    "      </article>",
    "    </div>",
    "  </section>",
    "</main>",
    ".page-shell { min-height: 100vh; background: #020617; color: white; }",
    ".bento-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); }",
  ],
};

const modeCards = [
  {
    value: "react-tailwind" as const,
    title: "React + Tailwind",
    desc: "Best for Next.js / React projects with reusable components.",
    icon: Code,
    tone: "border-blue-300/22 bg-blue-400/10 text-blue-200",
  },
  {
    value: "html-css" as const,
    title: "HTML / CSS / JS",
    desc: "Best for simple lab demos and direct browser execution.",
    icon: FileCode,
    tone: "border-cyan-300/22 bg-cyan-400/10 text-cyan-200",
  },
];

function ConvertContent() {
  const { user, isDemo } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<"react-tailwind" | "html-css">("react-tailwind");
  const [step, setStep] = useState<Step>("upload");
  const [errorMsg, setErrorMsg] = useState("");
  const [generationTick, setGenerationTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!progressStepOrder.includes(step)) return;

    const interval = window.setInterval(() => {
      setGenerationTick((current) => current + 1);
    }, step === "generating" ? 160 : 340);

    return () => window.clearInterval(interval);
  }, [step]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, or WebP)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum 5MB allowed.");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleConvert = async () => {
    if (!file || !preview || !user) return;

    try {
      setGenerationTick(0);
      setStep("uploading");

      let imageData = preview;
      if (file.size > 2 * 1024 * 1024) {
        imageData = await compressImage(file, 1200, 0.75);
      }

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");

      setStep("analyzing");
      await new Promise((resolve) => setTimeout(resolve, 420));
      setStep("generating");

      const convertRes = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageData,
          imageUrl: uploadData.data.secure_url,
          outputMode,
          userId: user.uid,
          fileName: file.name,
          cloudinaryPublicId: uploadData.data.public_id,
        }),
      });

      const convertData = await convertRes.json();
      if (!convertData.success) throw new Error(convertData.error || "Conversion failed");

      setStep("saving");

      if (isDemo || convertData.data.id.startsWith("local-")) {
        const lightweight = {
          id: convertData.data.id,
          title: convertData.data.title,
          outputMode: convertData.data.outputMode,
          createdAt: convertData.data.createdAt,
          status: convertData.data.status,
          cloudinaryUrl: convertData.data.cloudinaryUrl || convertData.data.cloudinaryPublicId,
        };
        const existing = getCleanedConversions();
        const filtered = existing.filter((conversion: any) => conversion.id !== convertData.data.id);
        filtered.unshift(lightweight);
        safeSetLocalStorage("blueprint_conversions", JSON.stringify(filtered));
        safeSetLocalStorage(`blueprint_conversion_${convertData.data.id}`, JSON.stringify(convertData.data));
      }

      setStep("done");
      toast.success("Conversion complete!");

      setTimeout(() => {
        router.push(`/convert/${convertData.data.id}`);
      }, 900);
    } catch (err: any) {
      console.error("Conversion error:", err);
      setErrorMsg(err.message || "Something went wrong");
      setGenerationTick(0);
      setStep("error");
      toast.error(err.message || "Conversion failed");
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setStep("upload");
    setErrorMsg("");
    setGenerationTick(0);
  };

  const progressSteps = [
    { key: "uploading", label: "Uploading secure image payload", icon: Cloud },
    { key: "analyzing", label: "Analyzing sketch modules", icon: ScanSearch },
    { key: "generating", label: "Generating frontend code", icon: Braces },
    { key: "saving", label: "Saving your workspace", icon: CheckCircle2 },
  ];

  const currentProgressIndex = progressStepOrder.indexOf(step);
  const percentRange =
    step === "done" || step === "upload" || step === "error" ? null : progressPercentRanges[step];
  const progressPercent =
    step === "done"
      ? 100
      : percentRange
        ? Math.min(percentRange[1], percentRange[0] + generationTick * (step === "generating" ? 1.2 : 2.6))
        : 0;
  const activeGenerationStage =
    step === "generating" ? Math.min(generationStages.length - 1, Math.floor(generationTick / 7)) : Math.max(0, currentProgressIndex);
  const snippetLines = liveCodeSnippets[outputMode];
  const visibleCodeLineCount =
    step === "generating" ? Math.min(snippetLines.length, Math.max(4, Math.floor(generationTick / 2) + 3)) : Math.min(snippetLines.length, 5);
  const visibleCodeLines = snippetLines.slice(0, visibleCodeLineCount);

  return (
    <div className="premium-shell min-h-[calc(100vh-76px)] overflow-hidden">
      <div className="aurora-field" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="premium-card overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-cyan-500/6 to-violet-500/10" />
            <div className="relative">
              <span className="pill">
                <Wand2 className="h-3.5 w-3.5" />
                New AI conversion
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Upload a wireframe and generate a polished frontend.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Use a clear photo or screenshot. The converter will preserve structure first, then apply responsive premium styling.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="premium-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Submission checklist</p>
                <p className="text-xs text-slate-500">Designed for lab presentation</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {["Readable UI", "Responsive output", "Live preview", "ZIP export"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="premium-card overflow-hidden">
                {!preview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(event) => event.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative min-h-[500px] cursor-pointer p-5"
                  >
                    <div className="absolute inset-5 rounded-[1.6rem] border-2 border-dashed border-blue-200/18 bg-blue-400/[0.035] transition-all group-hover:border-cyan-200/35 group-hover:bg-cyan-400/[0.045]" />
                    <div className="relative grid min-h-[460px] place-items-center text-center">
                      <div className="max-w-md">
                        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[1.6rem] border border-blue-300/22 bg-blue-400/10 text-blue-200 shadow-[0_0_55px_rgba(59,130,246,0.18)] transition-transform group-hover:scale-105">
                          <Upload className="h-9 w-9" />
                        </div>
                        <h2 className="text-2xl font-black text-white">Drop your sketch here</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-400">
                          JPG, PNG, or WebP. Maximum 5MB. For best output, upload a straight, high-contrast image.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-200">
                          <Sparkles className="h-3.5 w-3.5" />
                          Click to browse
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => event.target.files?.[0] && handleFileSelect(event.target.files[0])}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="relative border-b border-white/[0.08] bg-black/20">
                      <img src={preview} alt="Sketch preview" className="h-[460px] w-full object-contain p-4" />
                      <button
                        onClick={resetAll}
                        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/[0.10] bg-black/50 text-slate-300 backdrop-blur-xl transition-all hover:bg-black/70 hover:text-white"
                        aria-label="Remove selected sketch"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-400/10 text-blue-200">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{file?.name}</p>
                          <p className="text-xs font-semibold text-slate-500">{((file?.size || 0) / 1024).toFixed(1)} KB selected</p>
                        </div>
                      </div>

                      <button onClick={handleConvert} className="btn-primary w-full px-6 py-4 text-sm">
                        <Sparkles className="h-4 w-4" />
                        Analyze & generate code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="premium-card p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                      <Layers3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Choose output framework</p>
                      <p className="text-xs text-slate-500">You can switch preview tabs later.</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {modeCards.map((mode) => {
                      const Icon = mode.icon;
                      const active = outputMode === mode.value;
                      return (
                        <button
                          key={mode.value}
                          onClick={() => setOutputMode(mode.value)}
                          className={`rounded-3xl border p-4 text-left transition-all ${
                            active
                              ? `${mode.tone} shadow-[0_0_50px_rgba(59,130,246,0.10)]`
                              : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border ${active ? "border-white/15 bg-white/10" : "border-white/[0.08] bg-white/[0.04]"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white">{mode.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-400">{mode.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="premium-card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">AI quality pipeline</p>
                      <p className="text-xs text-slate-500">What happens after upload</p>
                    </div>
                    <Gauge className="h-5 w-5 text-cyan-200" />
                  </div>

                  <div className="space-y-3">
                    {[
                      { icon: ScanSearch, title: "Recognize layout", desc: "Header, sidebar, cards, content zones" },
                      { icon: Braces, title: "Generate code", desc: "Clean structure and responsive styling" },
                      { icon: MonitorPlay, title: "Preview safely", desc: "Render in workbench and export ZIP" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
                          <div>
                            <p className="text-xs font-black text-white">{item.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {["uploading", "analyzing", "generating", "saving", "done"].includes(step) && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="premium-card overflow-hidden p-5 sm:p-8">
                {step === "done" ? (
                  <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md py-14 text-center">
                    <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[1.6rem] border border-emerald-300/18 bg-emerald-400/10 text-emerald-200 shadow-[0_0_65px_rgba(52,211,153,0.16)]">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white">Conversion complete</h3>
                    <p className="mt-2 text-sm text-slate-400">Opening your AI workbench now...</p>
                  </motion.div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-[1.4rem] border border-blue-300/16 bg-blue-400/10 text-blue-200">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                            {step === "generating" ? "Live code draft" : "Conversion progress"}
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-white">
                            {step === "generating" ? generationStages[activeGenerationStage] : progressSteps[currentProgressIndex]?.label}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Keep this tab open while BlueprintAI builds the workspace.
                          </p>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                          <span>{Math.round(progressPercent)}% complete</span>
                          <span>{outputMode === "react-tailwind" ? "React + Tailwind" : "HTML / CSS"}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-400 shadow-[0_0_30px_rgba(20,216,255,0.35)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        {progressSteps.map((ps) => {
                          const Icon = ps.icon;
                          const thisIdx = progressStepOrder.indexOf(ps.key as Step);
                          const isDone = thisIdx < currentProgressIndex;
                          const isCurrent = thisIdx === currentProgressIndex;
                          return (
                            <div key={ps.key} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                              <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${
                                isDone
                                  ? "bg-emerald-400/10 text-emerald-200"
                                  : isCurrent
                                    ? "bg-blue-400/10 text-blue-200"
                                    : "bg-white/[0.04] text-slate-600"
                              }`}>
                                {isDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                              </div>
                              <span className={`text-sm font-bold ${isCurrent ? "text-white" : isDone ? "text-emerald-200" : "text-slate-600"}`}>
                                {ps.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="code-window min-w-0">
                      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Code className="h-4 w-4 flex-shrink-0 text-cyan-300" />
                          <span className="truncate font-mono text-xs font-bold text-slate-300">
                            {outputMode === "react-tailwind" ? "App.tsx" : "index.html + styles.css"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
                        </div>
                      </div>

                      <div className="h-80 overflow-x-auto overflow-y-hidden px-4 py-4 text-left font-mono text-[12px] leading-6">
                        {visibleCodeLines.map((line, index) => (
                          <div key={`${line}-${index}`} className="flex gap-3">
                            <span className="w-6 flex-shrink-0 text-right text-slate-700">{index + 1}</span>
                            <span
                              className={
                                line.trim().startsWith("<") || line.includes("className") || line.includes("class=")
                                  ? "text-cyan-100"
                                  : line.trim().startsWith("}") || line.trim().startsWith(")")
                                    ? "text-slate-400"
                                    : "text-blue-100"
                              }
                            >
                              {line}
                              {index === visibleCodeLines.length - 1 && step === "generating" && (
                                <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-300" />
                              )}
                            </span>
                          </div>
                        ))}

                        {step !== "generating" && (
                          <div className="mt-6 flex items-center gap-2 text-slate-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>
                              {step === "uploading" ? "Preparing image upload..." : step === "analyzing" ? "Waiting for vision analysis..." : "Finalizing workspace..."}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/[0.08] p-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {generationStages.map((stage, index) => {
                            const isDone = step === "saving" || index < activeGenerationStage;
                            const isCurrent = step === "generating" && index === activeGenerationStage;
                            return (
                              <div
                                key={stage}
                                className={`truncate rounded-xl px-3 py-2 text-[11px] font-bold ${
                                  isDone
                                    ? "bg-emerald-400/10 text-emerald-200"
                                    : isCurrent
                                      ? "bg-blue-400/10 text-blue-200"
                                      : "bg-white/[0.035] text-slate-600"
                                }`}
                              >
                                {stage}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="premium-card mx-auto max-w-2xl p-10 text-center">
                <div className="mx-auto mb-6 grid h-18 w-18 place-items-center rounded-[1.5rem] border border-red-300/18 bg-red-400/10 text-red-200">
                  <AlertCircle className="h-9 w-9" />
                </div>
                <h3 className="text-2xl font-black text-white">Conversion failed</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{errorMsg}</p>
                <button onClick={resetAll} className="btn-primary mt-7 px-6 py-3 text-sm">
                  Try again
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ConvertPage() {
  return (
    <AuthGuard>
      <ConvertContent />
    </AuthGuard>
  );
}
