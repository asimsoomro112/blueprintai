"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Code, FileCode, Copy, Download, RefreshCw, Trash2,
  Image as ImageIcon, Eye, Loader2, ArrowLeft, Sparkles,
  CheckCircle2, AlertTriangle, Layers, Save, MessageSquare,
  Send, PencilLine
} from "lucide-react";
import type { ConversionRecord } from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { exportToZip } from "@/lib/zip";
import { getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";

type SandpackFileMap = Record<string, string | { code: string; active?: boolean }>;
type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RelativeImport = {
  importPath: string;
  defaultImport?: string;
  namedImports: string[];
};

function getReactPreviewFilePaths(fileName: string): string[] {
  const trimmed = fileName.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
  if (!trimmed) return [];

  const withoutSrc = trimmed.replace(/^src\//, "");
  if (/^app\.(t|j)sx?$/i.test(withoutSrc)) return [];

  const withExtension = /\.(t|j)sx?$/i.test(withoutSrc) ? withoutSrc : `${withoutSrc}.tsx`;
  const safePath = withExtension
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  if (!safePath) return [];

  if (safePath.includes("/")) {
    return [`/${safePath}`];
  }

  return [`/${safePath}`, `/components/${safePath}`];
}

function resolveReactImportPath(importPath: string): string | null {
  const normalized = importPath.replace(/\\/g, "/").replace(/^\.?\//, "");
  if (!normalized || normalized.startsWith("../")) return null;
  if (/\.(css|scss|sass)$/i.test(normalized)) {
    return `/${normalized}`;
  }

  const withExtension = /\.(t|j)sx?$/i.test(normalized) ? normalized : `${normalized}.tsx`;
  const safePath = withExtension
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  return safePath ? `/${safePath}` : null;
}

function isIdentifier(value: string) {
  return /^[A-Za-z_$][\w$]*$/.test(value);
}

function getFallbackComponentName(importPath: string) {
  const fileName = importPath.split("/").filter(Boolean).pop() || "GeneratedSection";
  const baseName = fileName.replace(/\.(t|j)sx?$/i, "");
  const pascalName = baseName
    .split(/[^A-Za-z0-9_$]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

  return isIdentifier(pascalName) ? pascalName : "GeneratedSection";
}

function parseRelativeImports(code: string): RelativeImport[] {
  const imports: RelativeImport[] = [];
  const fromImportRegex = /import\s+([\s\S]*?)\s+from\s+["'](\.{1,2}\/[^"']+)["'];?/g;
  const sideEffectImportRegex = /import\s+["'](\.{1,2}\/[^"']+)["'];?/g;

  for (const match of code.matchAll(fromImportRegex)) {
    const clause = match[1].trim();
    const importPath = match[2].trim();
    if (!importPath.startsWith("./") || clause.startsWith("type ")) continue;

    const namedMatch = clause.match(/\{([^}]*)\}/);
    const namedImports = namedMatch
      ? namedMatch[1]
        .split(",")
        .map((part) => part.trim().split(/\s+as\s+/i)[0]?.trim())
        .filter((name) => name && isIdentifier(name))
      : [];

    const defaultCandidate = clause.split(",")[0]?.trim();
    const defaultImport = defaultCandidate &&
      !defaultCandidate.startsWith("{") &&
      !defaultCandidate.startsWith("*") &&
      isIdentifier(defaultCandidate)
      ? defaultCandidate
      : undefined;

    imports.push({ importPath, defaultImport, namedImports });
  }

  for (const match of code.matchAll(sideEffectImportRegex)) {
    const importPath = match[1].trim();
    if (importPath.startsWith("./")) {
      imports.push({ importPath, namedImports: [] });
    }
  }

  return imports;
}

function hasReactPreviewFile(files: SandpackFileMap, path: string) {
  if (files[path]) return true;
  const withoutExtension = path.replace(/\.(t|j)sx?$/i, "");
  return Object.keys(files).some((filePath) => filePath.replace(/\.(t|j)sx?$/i, "") === withoutExtension);
}

function createMissingComponentFile(relativeImport: RelativeImport) {
  if (/\.(css|scss|sass)$/i.test(relativeImport.importPath)) {
    return "";
  }

  const fallbackName = getFallbackComponentName(relativeImport.defaultImport || relativeImport.importPath);
  const defaultName = relativeImport.defaultImport && isIdentifier(relativeImport.defaultImport)
    ? relativeImport.defaultImport
    : fallbackName;
  const namedExports = Array.from(new Set(relativeImport.namedImports))
    .filter((name) => name !== defaultName);

  const namedCode = namedExports
    .map((name) => `export function ${name}(_props: Record<string, unknown>) {\n  return <MissingGeneratedSection label="${name}" />;\n}`)
    .join("\n\n");

  return `import React from "react";

function MissingGeneratedSection({ label }: { label: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-slate-700">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-slate-500">This generated component file was missing, so BlueprintAI added a safe preview placeholder.</p>
    </section>
  );
}

${namedCode ? `${namedCode}\n\n` : ""}export default function ${defaultName}(_props: Record<string, unknown>) {
  return <MissingGeneratedSection label="${defaultName}" />;
}
`;
}

function buildReactSandpackFiles(code: string, generatedFiles: Record<string, string> = {}): SandpackFileMap {
  const files: SandpackFileMap = {
    "/App.tsx": {
      code: code || "export default function App() { return <div />; }",
      active: true,
    },
  };

  Object.entries(generatedFiles).forEach(([fileName, fileCode]) => {
    getReactPreviewFilePaths(fileName).forEach((path) => {
      files[path] = fileCode;
    });
  });

  parseRelativeImports(code).forEach((relativeImport) => {
    const path = resolveReactImportPath(relativeImport.importPath);
    if (!path || hasReactPreviewFile(files, path)) return;
    files[path] = createMissingComponentFile(relativeImport);
  });

  return files;
}

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
        return (
          <div className="w-full h-full bg-white rounded-xl overflow-hidden">
            <iframe
              srcDoc={code}
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
      content: "What would you like changed in this website?",
    },
  ]);

  useEffect(() => {
    async function load() {
      if (!conversionId || !user) return;

      // Try demo/local storage first
      if (isDemo || !isFirebaseConfigured() || conversionId.startsWith("local-")) {
        const individualCached = localStorage.getItem(`blueprint_conversion_${conversionId}`);
        if (individualCached) {
          try {
            const found = JSON.parse(individualCached) as ConversionRecord;
            setConversion(found);
            setCode(found.generatedReactCode || "");
            setHtmlCode(found.generatedHtmlCode || "");
            setCssCode(found.generatedCssCode || "");
            setActiveTab(found.outputMode === "html-css" ? "html" : "react");
            setLoading(false);
            return;
          } catch (e) {
            console.error("Error parsing cached individual conversion:", e);
          }
        }

        // Fallback/Migration path
        const cached = getCleanedConversions();
        const found = cached.find((c: ConversionRecord) => c.id === conversionId);
        if (found) {
          setConversion(found);
          setCode(found.generatedReactCode || "");
          setHtmlCode(found.generatedHtmlCode || "");
          setCssCode(found.generatedCssCode || "");
          setActiveTab(found.outputMode === "html-css" ? "html" : "react");
          try {
            safeSetLocalStorage(`blueprint_conversion_${conversionId}`, JSON.stringify(found));
          } catch (e) {
            console.error("Failed to migrate legacy stored conversion:", e);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "conversions", conversionId));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as ConversionRecord;
          setConversion(data);
          setCode(data.generatedReactCode || "");
          setHtmlCode(data.generatedHtmlCode || "");
          setCssCode(data.generatedCssCode || "");
          setActiveTab(data.outputMode === "html-css" ? "html" : "react");
        }
      } catch (err) {
        console.error("Error loading conversion:", err);
      }
      setLoading(false);
    }
    load();
  }, [conversionId, user, isDemo]);

  const handleCopy = useCallback(() => {
    const textToCopy = activeTab === "react" ? code : `${htmlCode}\n\n/* CSS */\n${cssCode}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Code copied to clipboard!");
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(conversion.title || "export").replace(/[^a-z0-9]/gi, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
  }, [activeTab, code, htmlCode, cssCode, conversion]);

  const persistConversionUpdates = useCallback(async (
    updates: Partial<ConversionRecord>,
    successMessage?: string
  ) => {
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
      const index = cached.findIndex((c: ConversionRecord) => c.id === conversion.id);
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
    if (successMessage) {
      toast.success(successMessage);
    }

    return fullRecord;
  }, [conversion, isDemo]);

  const handleSave = async () => {
    if (!conversion) return;
    setSaving(true);
    try {
      await persistConversionUpdates({
        generatedReactCode: code,
        generatedHtmlCode: htmlCode,
        generatedCssCode: cssCode,
        generatedJsCode: conversion.generatedJsCode || "",
        generatedFiles: conversion.generatedFiles || {},
      }, "Edits saved in this workspace.");
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

      setCode(newReactCode);
      setHtmlCode(newHtmlCode);
      setCssCode(newCssCode);

      // Save to localStorage for demo mode or local fallback
      if (isDemo || conversion.id.startsWith("local-")) {
        const cached = getCleanedConversions();
        const index = cached.findIndex((c: ConversionRecord) => c.id === conversion.id);
        
        const individualCached = localStorage.getItem(`blueprint_conversion_${conversion.id}`);
        const prevFull = individualCached ? JSON.parse(individualCached) : conversion;

        const fullRecord: ConversionRecord = {
          ...prevFull,
          title: data.data.title || prevFull.title,
          detectedComponents: data.data.detectedComponents || prevFull.detectedComponents,
          layoutDescription: data.data.layoutDescription || prevFull.layoutDescription,
          generatedReactCode: newReactCode,
          generatedHtmlCode: newHtmlCode,
          generatedCssCode: newCssCode,
          generatedFiles: data.data.generatedFiles || prevFull.generatedFiles || {},
          confidenceScore: data.data.confidenceScore || prevFull.confidenceScore,
          warnings: data.data.warnings || prevFull.warnings,
          updatedAt: new Date().toISOString(),
        };

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
          safeSetLocalStorage("blueprint_conversions", JSON.stringify(cached));
        } else {
          cached.unshift(lightweight);
          safeSetLocalStorage("blueprint_conversions", JSON.stringify(cached));
        }

        safeSetLocalStorage(`blueprint_conversion_${conversion.id}`, JSON.stringify(fullRecord));
        setConversion(fullRecord);
      } else {
        setConversion(prev => prev ? {
          ...prev,
          title: data.data.title || prev.title,
          detectedComponents: data.data.detectedComponents || prev.detectedComponents,
          layoutDescription: data.data.layoutDescription || prev.layoutDescription,
          generatedReactCode: newReactCode,
          generatedHtmlCode: newHtmlCode,
          generatedCssCode: newCssCode,
          generatedFiles: data.data.generatedFiles || prev.generatedFiles || {},
          confidenceScore: data.data.confidenceScore || prev.confidenceScore,
          warnings: data.data.warnings || prev.warnings,
          updatedAt: new Date(),
        } : null);
      }
      toast.success("Code regenerated!");
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
      { role: "assistant", content: "Working on it..." },
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

      setCode(updatedReactCode);
      setHtmlCode(updatedHtmlCode);
      setCssCode(updatedCssCode);

      await persistConversionUpdates({
        generatedReactCode: updatedReactCode,
        generatedHtmlCode: updatedHtmlCode,
        generatedCssCode: updatedCssCode,
        generatedJsCode: updatedJsCode,
        generatedFiles: updatedFiles,
        warnings: data.data.warnings || conversion.warnings || [],
      });

      setAiMessages((messages) => [
        ...messages.slice(0, -1),
        {
          role: "assistant",
          content: data.data.summary || "Done. I updated the website and refreshed the preview.",
        },
      ]);
      toast.success("AI changes applied to the preview.");
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
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-sm text-gray-400">Loading conversion...</span>
        </div>
      </div>
    );
  }

  if (!conversion) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Conversion not found</h2>
          <p className="text-sm text-gray-400 mt-2">This conversion may have been deleted.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 px-5 py-2 text-sm font-medium text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentEditorCode = activeTab === "react" ? code : `${htmlCode}\n\n/* CSS */\n${cssCode}`;
  const previewCode = activeTab === "react"
    ? code
    : `<!DOCTYPE html><html><head><style>${cssCode}</style></head><body>${htmlCode.replace(/<link[^>]*>/g, "").replace(/<script[^>]*><\/script>/g, "")}</body><script>${conversion.generatedJsCode || ""}</script></html>`;

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-800/60 bg-[#030712]/90 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate">{conversion.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {conversion.detectedComponents?.length || 0} components</span>
                {conversion.confidenceScore > 0 && (
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {(conversion.confidenceScore * 100).toFixed(0)}% confidence</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Tab switcher */}
            <div className="flex bg-gray-800/50 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("react")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "react" ? "bg-blue-500/15 text-blue-400" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Code className="h-3.5 w-3.5" /> React
              </button>
              <button
                onClick={() => setActiveTab("html")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "html" ? "bg-cyan-500/15 text-cyan-400" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <FileCode className="h-3.5 w-3.5" /> HTML/CSS
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowCodeEditor((visible) => !visible)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                showCodeEditor
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5 border border-white/10"
              }`}
              title={showCodeEditor ? "Hide code editor" : "Edit generated code"}
            >
              <PencilLine className="h-4 w-4" />
              {showCodeEditor ? "Hide Code" : "Edit Code"}
            </button>
            {showCodeEditor && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all disabled:opacity-50"
                title="Save code edits in this workspace"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Edits
              </button>
            )}
            <button onClick={handleCopy} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Copy code">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={handleExport} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Export ZIP">
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              title="Regenerate from original sketch"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main workspace split view */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left: Original image */}
        <div className="w-full lg:w-[22%] min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-gray-800/60 bg-[#0a0f1e] lg:flex-shrink-0 overflow-auto">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Original Sketch</span>
            </div>
            {conversion.cloudinaryUrl ? (
              <img
                src={conversion.cloudinaryUrl}
                alt="Original sketch"
                className="w-full rounded-lg border border-gray-700/40"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-800/40 rounded-lg border border-gray-700/40 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-600" />
              </div>
            )}

            {/* Detected components */}
            {conversion.detectedComponents && conversion.detectedComponents.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Detected</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {conversion.detectedComponents.map((c, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                      {c.label || c.type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {conversion.warnings && conversion.warnings.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="text-xs font-medium text-amber-400 flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Warnings</span>
                {conversion.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-300/70 mt-1">{w}</p>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">AI Changes</span>
              </div>

              <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                {aiMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      message.role === "user"
                        ? "ml-4 bg-blue-500/15 text-blue-50"
                        : "mr-4 bg-white/[0.04] text-gray-300"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form
                className="mt-3 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAiRefine();
                }}
              >
                <textarea
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  disabled={aiEditing}
                  placeholder="Ask for a change..."
                  className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-[#050914] px-3 py-2 text-xs text-gray-100 outline-none placeholder:text-gray-500 focus:border-blue-400/50"
                />
                <button
                  type="submit"
                  disabled={aiEditing || !aiInstruction.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiEditing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Apply AI Change
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Center: Code editor */}
        {showCodeEditor && (
        <div className="w-full lg:w-[36%] min-h-[400px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-gray-800/60 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800/60 bg-[#0d1117]">
            <Code className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-400">
              {activeTab === "react" ? "App.tsx" : "index.html + styles.css"}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={activeTab === "react" ? "typescript" : "html"}
              theme="vs-dark"
              value={currentEditorCode}
              onChange={(val) => {
                if (activeTab === "react") {
                  setCode(val || "");
                } else {
                  // Robust split for HTML and CSS sections
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
                lineHeight: 20,
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                wordWrap: "on",
                tabSize: 2,
                renderLineHighlight: "line",
                automaticLayout: true,
              }}
            />
          </div>
        </div>
        )}

        {/* Right: Live preview */}
        <div className="w-full min-w-0 flex-1 min-h-[500px] lg:min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-800/60 bg-[#0d1117]">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">Live Preview</span>
            </div>
            <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              activeTab === "react"
                ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                : "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
            }`}>
              {activeTab === "react" ? "React App.tsx" : "HTML/CSS"}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden bg-white">
            <SandpackPreview
              code={previewCode}
              mode={activeTab === "react" ? "react" : "html-css"}
              generatedFiles={conversion.generatedFiles || {}}
            />
          </div>
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
