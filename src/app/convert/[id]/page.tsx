"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Code,
  FileCode,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Layers,
  Save,
  MessageSquare,
  Send,
  PencilLine,
  TerminalSquare,
  Gauge,
  Clock3,
  FileArchive,
  PanelLeft,
  Maximize2,
} from "lucide-react";
import type { ConversionRecord } from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { exportToZip } from "@/lib/zip";
import { getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";
import { buildReactSandpackFiles, normalizeGeneratedReact } from "@/lib/generated-react";

type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Dynamic imports to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const SandpackPreview = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => {
    const { SandpackProvider, SandpackLayout, SandpackPreview: SP } = mod;
    // Return a wrapper component
    return function SandpackWrapper({
      code,
      mode,
      generatedFiles = {},
    }: {
      code: string;
      mode: string;
      generatedFiles?: Record<string, string>;
    }) {
      if (mode === "html-css") {
        let injectedHtml = code;

        // Inject Tailwind CDN
        if (!injectedHtml.includes("cdn.tailwindcss.com")) {
          const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
          if (injectedHtml.includes("</head>")) {
            injectedHtml = injectedHtml.replace("</head>", `${tailwindScript}\n</head>`);
          } else {
            injectedHtml = `${tailwindScript}\n${injectedHtml}`;
          }
        }

        // Inject generated custom CSS
        const customCss = generatedFiles?.["styles.css"];
        if (customCss) {
          const styleTag = `<style>\n${customCss}\n</style>`;
          if (injectedHtml.includes("</head>")) {
            injectedHtml = injectedHtml.replace("</head>", `${styleTag}\n</head>`);
          } else {
            injectedHtml = `${injectedHtml}\n${styleTag}`;
          }
        }

        // Inject generated custom JS
        const customJs = generatedFiles?.["script.js"];
        if (customJs) {
          const scriptTag = `<script>\n${customJs}\n</script>`;
          if (injectedHtml.includes("</body>")) {
            injectedHtml = injectedHtml.replace("</body>", `${scriptTag}\n</body>`);
          } else {
            injectedHtml = `${injectedHtml}\n${scriptTag}`;
          }
        }

        return (
          <div className="w-full h-full bg-white rounded-xl overflow-hidden">
            <iframe
              srcDoc={injectedHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="HTML Preview"
            />
          </div>
        );
      }

      return (
        <div className="react-preview-shell h-full w-full bg-white">
          <SandpackProvider
            template="react-ts"
            theme="dark"
            files={buildReactSandpackFiles(code, generatedFiles)}
            className="react-preview-sandpack-wrapper"
            style={{ height: "100%", minHeight: "100%", width: "100%" }}
            customSetup={{
              dependencies: {
                "lucide-react": "latest",
                "framer-motion": "latest",
              },
            }}
            options={{
              classes: {
                "sp-layout": "react-preview-sandpack-layout",
                "sp-preview": "react-preview-sandpack-preview",
                "sp-preview-container": "react-preview-sandpack-container",
                "sp-preview-iframe": "react-preview-sandpack-iframe",
              },
              externalResources: [
                "https://cdn.tailwindcss.com",
              ],
            }}
          >
            <SandpackLayout
              style={{ height: "100%", minHeight: "100%", width: "100%", border: "none" }}
            >
              <SP
                style={{ height: "100%", minHeight: "100%", width: "100%" }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      );
    };
  }),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-blue-400" /></div> }
);


function normalizeDate(value: any) {
  if (!value) return null;
  try {
    return value.toDate ? value.toDate() : new Date(value);
  } catch {
    return null;
  }
}

function WorkbenchContent() {
  const { user, isDemo } = useAuth();
  const params = useParams();
  const router = useRouter();
  const conversionId = params.id as string;

  const [conversion, setConversion] = useState<ConversionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"react" | "html">("react");
  const [code, setCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: "Tell me what to improve: layout, colors, spacing, responsiveness, sections, or copy.",
    },
  ]);

  const applyConversionToState = useCallback((record: ConversionRecord) => {
    const normalizedReact = normalizeGeneratedReact(
      record.generatedReactCode || "",
      record.generatedFiles || {}
    );
    const normalizedRecord: ConversionRecord = {
      ...record,
      generatedReactCode: normalizedReact.appTsx,
      generatedFiles: normalizedReact.generatedFiles,
    };

    setConversion(normalizedRecord);
    setCode(normalizedReact.appTsx);
    setHtmlCode(record.generatedHtmlCode || "");
    setCssCode(record.generatedCssCode || "");
    setActiveTab(record.outputMode === "html-css" ? "html" : "react");

    return normalizedRecord;
  }, []);

  useEffect(() => {
    async function load() {
      if (!conversionId || !user) return;

      if (isDemo || !isFirebaseConfigured() || conversionId.startsWith("local-")) {
        const individualCached = localStorage.getItem(`blueprint_conversion_${conversionId}`);
        if (individualCached) {
          try {
            const found = JSON.parse(individualCached) as ConversionRecord;
            const normalized = applyConversionToState(found);
            safeSetLocalStorage(`blueprint_conversion_${conversionId}`, JSON.stringify(normalized));
            setLoading(false);
            return;
          } catch (error) {
            console.error("Error parsing cached individual conversion:", error);
          }
        }

        const cached = getCleanedConversions();
        const found = cached.find((item: ConversionRecord) => item.id === conversionId);
        if (found) {
          const normalized = applyConversionToState(found);
          try {
            safeSetLocalStorage(`blueprint_conversion_${conversionId}`, JSON.stringify(normalized));
          } catch (error) {
            console.error("Failed to migrate legacy stored conversion:", error);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "conversions", conversionId));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as ConversionRecord;
          applyConversionToState(data);
        }
      } catch (error) {
        console.error("Error loading conversion:", error);
        toast.error("Could not load this workspace.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [conversionId, user, isDemo, applyConversionToState]);

  const handleCopy = useCallback(() => {
    const textToCopy = activeTab === "react" ? code : `${htmlCode}\n\n/* CSS */\n${cssCode}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Code copied to clipboard.");
  }, [activeTab, code, htmlCode, cssCode]);

  const handleExport = useCallback(async () => {
    if (!conversion) return;
    try {
      const blob = await exportToZip(
        activeTab === "react" ? "react-tailwind" : "html-css",
        conversion.title || "blueprint-export",
        {
          appTsx: code,
          indexHtml: htmlCode,
          stylesCss: cssCode,
          scriptJs: conversion.generatedJsCode || "",
          generatedFiles: conversion.generatedFiles || {},
        }
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(conversion.title || "export").replace(/[^a-z0-9]/gi, "-")}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP exported successfully.");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
  }, [activeTab, code, htmlCode, cssCode, conversion]);

  const persistConversionUpdates = useCallback(
    async (updates: Partial<ConversionRecord>, successMessage?: string) => {
      if (!conversion) {
        throw new Error("Conversion is not loaded yet");
      }

      const isLocal = isDemo || !isFirebaseConfigured() || conversion.id.startsWith("local-");
      const updatedAt = new Date();
      const fullRecord: ConversionRecord = {
        ...conversion,
        ...updates,
        updatedAt: isLocal ? updatedAt.toISOString() : updatedAt,
      };

      if (isLocal) {
        const cached = getCleanedConversions();
        const index = cached.findIndex((item: ConversionRecord) => item.id === conversion.id);
        const lightweight = {
          id: fullRecord.id,
          title: fullRecord.title,
          outputMode: fullRecord.outputMode,
          createdAt: fullRecord.createdAt,
          status: fullRecord.status,
          cloudinaryUrl: fullRecord.cloudinaryUrl || fullRecord.cloudinaryPublicId,
          updatedAt: fullRecord.updatedAt,
        };

        if (index !== -1) {
          cached[index] = lightweight;
        } else {
          cached.unshift(lightweight);
        }

        safeSetLocalStorage("blueprint_conversions", JSON.stringify(cached));
        safeSetLocalStorage(`blueprint_conversion_${conversion.id}`, JSON.stringify(fullRecord));
      } else {
        await updateDoc(doc(db, "conversions", conversion.id), {
          ...updates,
          updatedAt,
        });
      }

      setConversion(fullRecord);
      if (successMessage) toast.success(successMessage);

      return fullRecord;
    },
    [conversion, isDemo]
  );

  const handleSave = async () => {
    if (!conversion) return;
    setSaving(true);
    try {
      const normalizedReact = normalizeGeneratedReact(code, conversion.generatedFiles || {});
      setCode(normalizedReact.appTsx);
      await persistConversionUpdates(
        {
          generatedReactCode: normalizedReact.appTsx,
          generatedHtmlCode: htmlCode,
          generatedCssCode: cssCode,
          generatedJsCode: conversion.generatedJsCode || "",
          generatedFiles: normalizedReact.generatedFiles,
        },
        "Manual edits saved."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!conversion) return;
    setRegenerating(true);

    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversionId: conversion.id,
          imageUrl: conversion.cloudinaryUrl,
          imageBase64: conversion.cloudinaryUrl,
          outputMode: activeTab === "react" ? "react-tailwind" : "html-css",
          userId: user?.uid,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const newReactCode = data.data.generatedReactCode || code;
      const newHtmlCode = data.data.generatedHtmlCode || htmlCode;
      const newCssCode = data.data.generatedCssCode || cssCode;
      const newJsCode = data.data.generatedJsCode ?? conversion.generatedJsCode ?? "";
      const normalizedReact = normalizeGeneratedReact(
        newReactCode,
        data.data.generatedFiles || conversion.generatedFiles || {}
      );

      setCode(normalizedReact.appTsx);
      setHtmlCode(newHtmlCode);
      setCssCode(newCssCode);

      const fullRecord: ConversionRecord = {
        ...conversion,
        title: data.data.title || conversion.title,
        detectedComponents: data.data.detectedComponents || conversion.detectedComponents,
        layoutDescription: data.data.layoutDescription || conversion.layoutDescription,
        generatedReactCode: normalizedReact.appTsx,
        generatedHtmlCode: newHtmlCode,
        generatedCssCode: newCssCode,
        generatedJsCode: newJsCode,
        generatedFiles: normalizedReact.generatedFiles,
        confidenceScore: data.data.confidenceScore || conversion.confidenceScore,
        warnings: data.data.warnings || conversion.warnings,
        updatedAt: new Date().toISOString(),
      };

      if (isDemo || conversion.id.startsWith("local-")) {
        const cached = getCleanedConversions();
        const index = cached.findIndex((item: ConversionRecord) => item.id === conversion.id);
        const lightweight = {
          id: fullRecord.id,
          title: fullRecord.title,
          outputMode: fullRecord.outputMode,
          createdAt: fullRecord.createdAt,
          status: fullRecord.status,
          cloudinaryUrl: fullRecord.cloudinaryUrl || fullRecord.cloudinaryPublicId,
          updatedAt: fullRecord.updatedAt,
        };

        if (index !== -1) cached[index] = lightweight;
        else cached.unshift(lightweight);

        safeSetLocalStorage("blueprint_conversions", JSON.stringify(cached));
        safeSetLocalStorage(`blueprint_conversion_${conversion.id}`, JSON.stringify(fullRecord));
      }

      setConversion(fullRecord);
      toast.success("Code regenerated.");
    } catch (err: any) {
      toast.error(err.message || "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  };

  const handleAiRefine = async () => {
    if (!conversion || aiEditing) return;

    const instruction = aiInstruction.trim();
    if (!instruction) {
      toast.error("Tell the AI what you want to change first.");
      return;
    }

    setAiInstruction("");
    setAiEditing(true);
    setAiMessages((messages) => [
      ...messages,
      { role: "user", content: instruction },
      { role: "assistant", content: "Applying the change and refreshing the preview..." },
    ]);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversionId: conversion.id,
          userId: user?.uid,
          instruction,
          outputMode: activeTab === "react" ? "react-tailwind" : "html-css",
          generatedReactCode: code,
          generatedHtmlCode: htmlCode,
          generatedCssCode: cssCode,
          generatedJsCode: conversion.generatedJsCode || "",
          generatedFiles: conversion.generatedFiles || {},
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "AI edit failed");

      const updatedReactCode = data.data.generatedReactCode ?? code;
      const updatedHtmlCode = data.data.generatedHtmlCode ?? htmlCode;
      const updatedCssCode = data.data.generatedCssCode ?? cssCode;
      const updatedJsCode = data.data.generatedJsCode ?? conversion.generatedJsCode ?? "";
      const updatedFiles = data.data.generatedFiles ?? conversion.generatedFiles ?? {};
      const normalizedReact = normalizeGeneratedReact(updatedReactCode, updatedFiles);

      setCode(normalizedReact.appTsx);
      setHtmlCode(updatedHtmlCode);
      setCssCode(updatedCssCode);

      await persistConversionUpdates({
        generatedReactCode: normalizedReact.appTsx,
        generatedHtmlCode: updatedHtmlCode,
        generatedCssCode: updatedCssCode,
        generatedJsCode: updatedJsCode,
        generatedFiles: normalizedReact.generatedFiles,
        warnings: data.data.warnings || conversion.warnings || [],
      });

      setAiMessages((messages) => [
        ...messages.slice(0, -1),
        {
          role: "assistant",
          content: data.data.summary || "Done. The website was updated and the preview was refreshed.",
        },
      ]);
      toast.success("AI changes applied.");
    } catch (err: any) {
      setAiMessages((messages) => [
        ...messages.slice(0, -1),
        {
          role: "assistant",
          content: err.message || "I could not apply that change. Try a more specific instruction.",
        },
      ]);
      toast.error(err.message || "AI edit failed");
    } finally {
      setAiEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-76px)] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-300" />
          <p className="mt-4 text-sm font-bold text-slate-400">Loading premium workbench...</p>
        </div>
      </div>
    );
  }

  if (!conversion) {
    return (
      <div className="grid min-h-[calc(100vh-76px)] place-items-center px-4">
        <div className="premium-card max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-11 w-11 text-amber-300" />
          <h2 className="mt-5 text-2xl font-black text-white">Conversion not found</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">This workspace may have been deleted or is stored in another browser profile.</p>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary mt-6 px-5 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentEditorCode = activeTab === "react" ? code : `${htmlCode}\n\n/* CSS */\n${cssCode}`;
  const previewCode =
    activeTab === "react"
      ? code
      : `<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode
        .replace(/<link[^>]*>/g, "")
        .replace(/<script[^>]*><\/script>/g, "")}</body><script>${conversion.generatedJsCode || ""}</script></html>`;
  const createdDate = normalizeDate(conversion.createdAt);
  const confidence = conversion.confidenceScore ? Math.round(conversion.confidenceScore * 100) : 0;
  const componentCount = conversion.detectedComponents?.length || 0;
  const generatedFileCount = Object.keys(conversion.generatedFiles || {}).length + 1;

  return (
    <div className="premium-shell h-[calc(100vh-76px)] min-h-[720px] overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b border-white/[0.08] bg-[#040915]/78 px-3 py-3 shadow-[0_16px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:px-5">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.045] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
                title="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-sm font-black text-white sm:text-base">{conversion.title || "Untitled Conversion"}</h1>
                  <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    {conversion.status || "completed"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    {componentCount} detected modules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" />
                    {confidence}% confidence
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {createdDate ? createdDate.toLocaleDateString() : "recent"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1">
                <button
                  onClick={() => setActiveTab("react")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${activeTab === "react" ? "bg-blue-400/14 text-blue-200" : "text-slate-500 hover:text-slate-200"
                    }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  React
                </button>
                <button
                  onClick={() => setActiveTab("html")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all ${activeTab === "html" ? "bg-cyan-400/14 text-cyan-200" : "text-slate-500 hover:text-slate-200"
                    }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  HTML/CSS
                </button>
              </div>

              <button
                onClick={() => setShowCodeEditor((visible) => !visible)}
                className={`btn-secondary px-3 py-2 text-xs ${showCodeEditor ? "border-blue-300/20 bg-blue-400/10 text-blue-200" : ""}`}
                title={showCodeEditor ? "Hide code editor" : "Show code editor"}
              >
                <PencilLine className="h-4 w-4" />
                {showCodeEditor ? "Hide code" : "Edit code"}
              </button>

              {showCodeEditor && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-secondary border-emerald-300/18 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-50"
                  title="Save code edits"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              )}

              <button onClick={handleCopy} className="btn-secondary px-3 py-2 text-xs" title="Copy code">
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button onClick={handleExport} className="btn-secondary px-3 py-2 text-xs" title="Export ZIP">
                <FileArchive className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
                title="Regenerate from original sketch"
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col gap-3 overflow-y-auto p-3 lg:flex-row lg:overflow-hidden">
          <aside className="premium-card flex min-h-[360px] w-full flex-col overflow-hidden lg:min-h-0 lg:w-[300px] xl:w-[340px]">
            <div className="border-b border-white/[0.08] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Original sketch</p>
                  <p className="text-xs text-slate-500">Source image and AI detection</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {conversion.cloudinaryUrl ? (
                <img
                  src={conversion.cloudinaryUrl}
                  alt="Original sketch"
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/20"
                />
              ) : (
                <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Mode", value: activeTab === "react" ? "React" : "HTML" },
                  { label: "Files", value: generatedFileCount },
                  { label: "Confidence", value: `${confidence}%` },
                  { label: "Modules", value: componentCount },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {conversion.detectedComponents && conversion.detectedComponents.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Detected modules</p>
                  <div className="flex flex-wrap gap-2">
                    {conversion.detectedComponents.map((component, index) => (
                      <span key={`${component.label}-${index}`} className="rounded-full border border-blue-300/16 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">
                        {component.label || component.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {conversion.layoutDescription && (
                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    <PanelLeft className="h-3.5 w-3.5" />
                    Layout summary
                  </p>
                  <p className="text-xs leading-6 text-slate-400">{conversion.layoutDescription}</p>
                </div>
              )}

              {conversion.warnings && conversion.warnings.length > 0 && (
                <div className="mt-5 rounded-2xl border border-amber-300/18 bg-amber-400/10 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-black text-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </p>
                  {conversion.warnings.map((warning, index) => (
                    <p key={index} className="mt-1 text-xs leading-5 text-amber-100/75">
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {showCodeEditor && (
            <section className="premium-card flex min-h-[420px] w-full flex-col overflow-hidden lg:min-h-0 lg:w-[38%]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4 text-cyan-200" />
                  <span className="font-mono text-xs font-black text-slate-300">
                    {activeTab === "react" ? "App.tsx" : "index.html + styles.css"}
                  </span>
                </div>
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Monaco
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language={activeTab === "react" ? "typescript" : "html"}
                  theme="vs-dark"
                  value={currentEditorCode}
                  onChange={(val) => {
                    if (activeTab === "react") {
                      setCode(val || "");
                    } else {
                      const cleanVal = val || "";
                      const match = cleanVal.match(/\/\*\s*CSS\s*\*\//i);
                      if (match && match.index !== undefined) {
                        const separator = match[0];
                        const index = match.index;
                        setHtmlCode(cleanVal.substring(0, index).trim());
                        setCssCode(cleanVal.substring(index + separator.length).trim());
                      } else {
                        setHtmlCode(cleanVal);
                      }
                    }
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 21,
                    scrollBeyondLastLine: false,
                    padding: { top: 14 },
                    wordWrap: "on",
                    tabSize: 2,
                    renderLineHighlight: "line",
                    automaticLayout: true,
                    smoothScrolling: true,
                  }}
                />
              </div>
            </section>
          )}

          <section className="premium-card flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">Live preview</p>
                  <p className="truncate text-xs text-slate-500">Rendered output updates when code changes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${activeTab === "react" ? "border-blue-300/18 bg-blue-400/10 text-blue-200" : "border-cyan-300/18 bg-cyan-400/10 text-cyan-200"
                  }`}>
                  {activeTab === "react" ? "React sandbox" : "HTML iframe"}
                </span>
                <button
                  onClick={() => setShowCodeEditor(true)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.045] text-slate-400 hover:text-white"
                  title="Show editor"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-white">
              <SandpackPreview
                code={previewCode}
                mode={activeTab === "react" ? "react" : "html-css"}
                generatedFiles={conversion.generatedFiles || {}}
              />
            </div>
          </section>

          <aside className="premium-card flex min-h-[420px] w-full flex-col overflow-hidden lg:min-h-0 lg:w-[330px] xl:w-[360px]">
            <div className="border-b border-white/[0.08] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">AI refinement</p>
                  <p className="text-xs text-slate-500">Ask for targeted UI/code edits</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="space-y-3">
                {aiMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-2xl px-4 py-3 text-xs leading-6 ${message.role === "user"
                      ? "ml-7 border border-blue-300/14 bg-blue-400/10 text-blue-50"
                      : "mr-7 border border-white/[0.07] bg-white/[0.045] text-slate-300"
                      }`}
                  >
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {message.role === "user" ? "You" : "BlueprintAI"}
                    </p>
                    {message.content}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Prompt ideas</p>
                {[
                  "Make the design more premium with better spacing.",
                  "Convert this into a responsive landing page.",
                  "Improve colors, typography and card hierarchy.",
                ].map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setAiInstruction(idea)}
                    className="mb-2 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="border-t border-white/[0.08] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleAiRefine();
              }}
            >
              <textarea
                value={aiInstruction}
                onChange={(event) => setAiInstruction(event.target.value)}
                disabled={aiEditing}
                placeholder="Example: make hero more modern, improve mobile layout, add cards..."
                className="min-h-28 w-full resize-none rounded-2xl border border-white/[0.09] bg-white/[0.045] px-4 py-3 text-xs leading-6 text-slate-100 outline-none placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={aiEditing || !aiInstruction.trim()}
                className="btn-primary mt-3 w-full px-4 py-3 text-xs disabled:opacity-50"
              >
                {aiEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Apply AI change
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ConvertIdPage() {
  return (
    <AuthGuard>
      <WorkbenchContent />
    </AuthGuard>
  );
}
