"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { compressImage, getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";
import {
  Upload, Image as ImageIcon, X, Sparkles, Code, FileCode,
  Loader2, CheckCircle2, AlertCircle
} from "lucide-react";

type Step = "upload" | "uploading" | "analyzing" | "generating" | "saving" | "done" | "error";

const progressStepOrder: Step[] = ["uploading", "analyzing", "generating", "saving"];

const progressPercentRanges: Record<Exclude<Step, "upload" | "done" | "error">, [number, number]> = {
  uploading: [8, 26],
  analyzing: [28, 48],
  generating: [50, 86],
  saving: [88, 96],
};

const generationStages = [
  "Reading sketch hierarchy",
  "Detecting layout blocks",
  "Naming components",
  "Writing markup",
  "Applying responsive styles",
  "Preparing preview files",
];

const liveCodeSnippets: Record<"react-tailwind" | "html-css", string[]> = {
  "react-tailwind": [
    "export default function App() {",
    "  return (",
    "    <main className=\"min-h-screen bg-slate-950 text-white\">",
    "      <section className=\"mx-auto grid max-w-6xl gap-6 px-6 py-12\">",
    "        <header className=\"flex items-center justify-between\">",
    "          <h1 className=\"text-3xl font-bold\">Generated Interface</h1>",
    "          <button className=\"rounded-lg bg-blue-500 px-4 py-2\">Action</button>",
    "        </header>",
    "        <div className=\"grid gap-4 md:grid-cols-3\">",
    "          <article className=\"rounded-xl border border-white/10 p-5\">",
    "            <h2 className=\"font-semibold\">Sketch section</h2>",
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
    "  <section class=\"hero\">",
    "    <nav class=\"topbar\">",
    "      <strong>Generated Interface</strong>",
    "      <button>Action</button>",
    "    </nav>",
    "    <div class=\"layout-grid\">",
    "      <article class=\"panel\">",
    "        <h2>Sketch section</h2>",
    "        <p>AI maps your drawing into clean frontend code.</p>",
    "      </article>",
    "    </div>",
    "  </section>",
    "</main>",
    ".page-shell { min-height: 100vh; background: #020617; color: white; }",
    ".layout-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); }",
  ],
};

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
    }, step === "generating" ? 180 : 360);

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

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleConvert = async () => {
    if (!file || !preview || !user) return;

    try {
      setGenerationTick(0);

      // Step 1: Compress image
      setStep("uploading");
      let imageData = preview;
      if (file.size > 2 * 1024 * 1024) {
        imageData = await compressImage(file, 1200, 0.75);
      }

      // Step 2: Upload to Cloudinary
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");

      // Step 3: Analyze with Gemini
      setStep("analyzing");
      await new Promise(r => setTimeout(r, 500)); // Brief visual pause
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

      // Step 4: Save
      setStep("saving");

      // Save to localStorage for demo mode or local fallback
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
        const filtered = existing.filter((c: any) => c.id !== convertData.data.id);
        filtered.unshift(lightweight);
        safeSetLocalStorage("blueprint_conversions", JSON.stringify(filtered));
        safeSetLocalStorage(`blueprint_conversion_${convertData.data.id}`, JSON.stringify(convertData.data));
      }

      setStep("done");
      toast.success("Conversion complete!");

      // Navigate to workbench
      setTimeout(() => {
        router.push(`/convert/${convertData.data.id}`);
      }, 1200);
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
    { key: "uploading", label: "Uploading image to cloud...", icon: Upload },
    { key: "analyzing", label: "AI analyzing sketch layout...", icon: Sparkles },
    { key: "generating", label: "Generating frontend code...", icon: Code },
    { key: "saving", label: "Saving to your history...", icon: CheckCircle2 },
  ];

  const currentProgressIndex = progressStepOrder.indexOf(step);
  const percentRange =
    step === "done" || step === "upload" || step === "error"
      ? null
      : progressPercentRanges[step];
  const progressPercent =
    step === "done"
      ? 100
      : percentRange
        ? Math.min(percentRange[1], percentRange[0] + generationTick * (step === "generating" ? 1.3 : 2.8))
        : 0;
  const activeGenerationStage =
    step === "generating"
      ? Math.min(generationStages.length - 1, Math.floor(generationTick / 7))
      : Math.max(0, currentProgressIndex);
  const snippetLines = liveCodeSnippets[outputMode];
  const visibleCodeLineCount =
    step === "generating"
      ? Math.min(snippetLines.length, Math.max(4, Math.floor(generationTick / 2) + 3))
      : Math.min(snippetLines.length, 4);
  const visibleCodeLines = snippetLines.slice(0, visibleCodeLineCount);

  return (
    <div className="min-h-[calc(100vh-60px)] relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="blob bg-blue-500 w-[500px] h-[500px] top-[-10%] left-[-20%] blob-animate-1" />
      <div className="blob bg-indigo-500 w-[450px] h-[450px] bottom-[10%] right-[-15%] blob-animate-2" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">New Conversion</h1>
          <p className="text-sm text-gray-400 mt-1">Upload a hand-drawn wireframe to generate code</p>
        </div>

        <AnimatePresence mode="wait">
          {/* ─── UPLOAD STATE ─── */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Dropzone */}
              {!preview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card p-12 border-2 border-dashed border-gray-600/50 hover:border-blue-500/40 transition-all cursor-pointer text-center group"
                >
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200">
                    Drop your sketch here or click to browse
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">Accepts JPG, PNG, WebP · Max 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                /* Preview */
                <div className="glass-card overflow-hidden">
                  <div className="relative">
                    <img src={preview} alt="Sketch Preview" className="w-full max-h-[400px] object-contain bg-gray-900/50" />
                    <button
                      onClick={resetAll}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-black/80 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-6 border-t border-gray-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{file?.name}</p>
                        <p className="text-xs text-gray-500">{((file?.size || 0) / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    {/* Output Mode Selection */}
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Output Framework</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setOutputMode("react-tailwind")}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                            outputMode === "react-tailwind"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-white/5 text-gray-400 border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <Code className="h-4 w-4" /> React + Tailwind
                        </button>
                        <button
                          onClick={() => setOutputMode("html-css")}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                            outputMode === "html-css"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : "bg-white/5 text-gray-400 border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <FileCode className="h-4 w-4" /> HTML / CSS
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleConvert}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-semibold text-white btn-glow transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Sparkles className="h-4 w-4" /> Analyze & Generate Code
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── PROGRESS STATE ─── */}
          {["uploading", "analyzing", "generating", "saving", "done"].includes(step) && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-5 sm:p-8">
                {step === "done" ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Conversion Complete!</h3>
                    <p className="text-sm text-gray-400 mt-2">Redirecting to your workbench...</p>
                  </motion.div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-blue-300 uppercase tracking-wider">
                            {step === "generating" ? "Live code draft" : "Conversion progress"}
                          </p>
                          <h3 className="text-xl font-bold text-white mt-1">
                            {step === "generating" ? generationStages[activeGenerationStage] : progressSteps[currentProgressIndex]?.label}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>{Math.round(progressPercent)}% complete</span>
                          <span>{outputMode === "react-tailwind" ? "React + Tailwind" : "HTML / CSS"}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 mt-7">
                        {progressSteps.map((ps) => {
                          const Icon = ps.icon;
                          const thisIdx = progressStepOrder.indexOf(ps.key as Step);
                          const isDone = thisIdx < currentProgressIndex;
                          const isCurrent = thisIdx === currentProgressIndex;
                          return (
                            <div key={ps.key} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isDone ? "bg-emerald-500/10 text-emerald-400" :
                                isCurrent ? "bg-blue-500/10 text-blue-400" :
                                "bg-gray-800/50 text-gray-600"
                              }`}>
                                {isDone ? <CheckCircle2 className="h-4 w-4" /> :
                                 isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                 <Icon className="h-4 w-4" />}
                              </div>
                              <span className={`text-sm ${
                                isDone ? "text-emerald-400" :
                                isCurrent ? "text-white font-medium" :
                                "text-gray-600"
                              }`}>{ps.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-gray-800 bg-[#050816] overflow-hidden">
                      <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Code className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-300 truncate">
                            {outputMode === "react-tailwind" ? "App.tsx" : "index.html + styles.css"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-red-400/80" />
                          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                        </div>
                      </div>
                      <div className="h-72 overflow-x-auto overflow-y-hidden px-4 py-4 font-mono text-[12px] leading-5 text-left">
                        {visibleCodeLines.map((line, index) => (
                          <div key={`${line}-${index}`} className="flex gap-3">
                            <span className="w-6 flex-shrink-0 text-right text-gray-600">{index + 1}</span>
                            <span className={
                              line.trim().startsWith("<") || line.includes("className") || line.includes("class=")
                                ? "text-cyan-200"
                                : line.trim().startsWith("}") || line.trim().startsWith(")")
                                  ? "text-gray-400"
                                  : "text-blue-200"
                            }>
                              {line}
                              {index === visibleCodeLines.length - 1 && step === "generating" && (
                                <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-cyan-300" />
                              )}
                            </span>
                          </div>
                        ))}
                        {step !== "generating" && (
                          <div className="mt-5 flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>
                              {step === "uploading" ? "Preparing image payload..." : step === "analyzing" ? "Waiting for vision analysis..." : "Finalizing files..."}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-800 px-4 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {generationStages.map((stage, index) => {
                            const isDone = step === "saving" || index < activeGenerationStage;
                            const isCurrent = step === "generating" && index === activeGenerationStage;
                            return (
                              <div
                                key={stage}
                                className={`truncate rounded-md px-2 py-1.5 text-[11px] ${
                                  isDone
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : isCurrent
                                      ? "bg-blue-500/10 text-blue-300"
                                      : "bg-gray-900 text-gray-600"
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

          {/* ─── ERROR STATE ─── */}
          {step === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass-card p-10 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Conversion Failed</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{errorMsg}</p>
                <button
                  onClick={resetAll}
                  className="mt-6 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl btn-glow transition-all"
                >
                  Try Again
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
