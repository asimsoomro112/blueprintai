"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  BarChart3,
  CheckCircle2,
  CalendarDays,
  HardDrive,
  Eye,
  Trash2,
  FileCode,
  Image as ImageIcon,
  Inbox,
  Sparkles,
  Wand2,
  Clock3,
  Activity,
  ArrowUpRight,
  Layers3,
  Download,
  ShieldCheck,
  Database,
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { ConversionRecord } from "@/types";
import { formatRelativeTime, truncate, getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";

const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};

function toDate(value: any) {
  if (!value) return null;
  try {
    return value.toDate ? value.toDate() : new Date(value);
  } catch {
    return null;
  }
}

function DashboardContent() {
  const { user, isDemo } = useAuth();
  const router = useRouter();
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const localResults: ConversionRecord[] = getCleanedConversions();

      if (isDemo || !isFirebaseConfigured()) {
        setConversions(localResults);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "conversions"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConversionRecord));

        const merged = [...results];
        localResults.forEach((localConversion) => {
          if (!merged.some((cloudConversion) => cloudConversion.id === localConversion.id)) {
            merged.push(localConversion);
          }
        });

        merged.sort((a, b) => {
          const ad = toDate(a.createdAt)?.getTime() || 0;
          const bd = toDate(b.createdAt)?.getTime() || 0;
          return bd - ad;
        });

        setConversions(merged);
      } catch (err) {
        console.error("Error loading conversions:", err);
        setConversions(localResults);
        toast.error("Cloud history failed to load, showing local workspace.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, isDemo]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this conversion?")) return;

    try {
      if (!isDemo && isFirebaseConfigured() && !id.startsWith("local-")) {
        await deleteDoc(doc(db, "conversions", id));
      }

      const updated = conversions.filter((conversion) => conversion.id !== id);
      setConversions(updated);

      const localCached = getCleanedConversions();
      const updatedLocal = localCached.filter((conversion: any) => conversion.id !== id);
      safeSetLocalStorage("blueprint_conversions", JSON.stringify(updatedLocal));
      localStorage.removeItem(`blueprint_conversion_${id}`);

      toast.success("Conversion deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete conversion");
    }
  };

  const completed = conversions.filter((conversion) => conversion.status === "completed").length;
  const thisMonth = conversions.filter((conversion) => {
    const date = toDate(conversion.createdAt);
    const now = new Date();
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const reactCount = conversions.filter((conversion) => conversion.outputMode === "react-tailwind").length;
  const htmlCount = conversions.filter((conversion) => conversion.outputMode === "html-css").length;
  const averageConfidence = conversions.length
    ? Math.round(
        (conversions.reduce((sum, conversion) => sum + (Number(conversion.confidenceScore) || 0), 0) / conversions.length) * 100
      )
    : 0;

  const stats = [
    {
      icon: BarChart3,
      label: "Total conversions",
      value: conversions.length,
      detail: "Saved workspaces",
      accent: "from-blue-400/20 to-cyan-400/5 text-blue-200 border-blue-300/15",
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: completed,
      detail: "Successful outputs",
      accent: "from-emerald-400/20 to-teal-400/5 text-emerald-200 border-emerald-300/15",
    },
    {
      icon: CalendarDays,
      label: "This month",
      value: thisMonth,
      detail: "Recent productivity",
      accent: "from-amber-400/20 to-orange-400/5 text-amber-200 border-amber-300/15",
    },
    {
      icon: HardDrive,
      label: "Storage estimate",
      value: `${(conversions.length * 0.15).toFixed(1)} MB`,
      detail: "Lightweight history",
      accent: "from-violet-400/20 to-fuchsia-400/5 text-violet-200 border-violet-300/15",
    },
  ];

  const latest = conversions[0];

  return (
    <div className="premium-shell min-h-[calc(100vh-76px)] overflow-hidden">
      <div className="aurora-field" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          className="mb-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="premium-card overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-cyan-500/5 to-violet-500/10" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="pill">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Web Engineering Studio
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Welcome back, {user?.displayName?.split(" ")[0] || "Creator"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Manage sketch conversions, reopen the workbench, refine generated interfaces, and export ready-to-run frontend code.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/convert" className="btn-primary px-5 py-3 text-sm">
                  <Plus className="h-4 w-4" />
                  New conversion
                </Link>
                {latest && (
                  <Link href={`/convert/${latest.id}`} className="btn-secondary px-5 py-3 text-sm">
                    <Clock3 className="h-4 w-4" />
                    Continue latest
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="premium-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">Workspace health</p>
                <p className="text-xs text-slate-500">{isDemo ? "Local demo mode" : "Cloud sync mode"}</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "React outputs", value: reactCount, icon: FileCode },
                { label: "HTML outputs", value: htmlCount, icon: FileCode },
                { label: "Avg confidence", value: `${averageConfidence}%`, icon: Activity },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                    <span className="text-sm font-black text-white">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="bento-card p-5"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i}
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${stat.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.detail}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <motion.aside
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <div className="premium-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Quick actions</p>
                  <p className="text-xs text-slate-500">Common workflow shortcuts</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Link href="/convert" className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.075]">
                  Convert new sketch
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                </Link>
                <Link href="/settings" className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/[0.075]">
                  Check integrations
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                </Link>
              </div>
            </div>

            <div className="premium-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Project modules</p>
                  <p className="text-xs text-slate-500">Show these in your lab demo</p>
                </div>
              </div>
              {[
                { icon: Upload, label: "Upload + compression" },
                { icon: Database, label: "Firestore/local history" },
                { icon: Eye, label: "Preview sandbox" },
                { icon: Download, label: "ZIP exporter" },
              ].map((module) => {
                const Icon = module.icon;
                return (
                  <div key={module.label} className="mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.035] px-3 py-2.5">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    <span className="text-xs font-bold text-slate-300">{module.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.aside>

          <motion.section
            className="premium-card overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
          >
            <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Recent conversions</h2>
                <p className="text-sm text-slate-500">Open any workspace to preview, edit, regenerate, or export.</p>
              </div>
              <button
                onClick={() => router.push("/convert")}
                className="btn-secondary px-4 py-2.5 text-xs"
              >
                <Plus className="h-4 w-4" />
                Add new
              </button>
            </div>

            {loading ? (
              <div className="grid place-items-center p-16 text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-blue-300/20 border-t-blue-300" />
                <p className="text-sm font-bold text-slate-400">Loading conversion history...</p>
              </div>
            ) : conversions.length === 0 ? (
              <div className="grid place-items-center px-6 py-16 text-center">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-white/[0.08] bg-white/[0.045]">
                  <Inbox className="h-7 w-7 text-slate-500" />
                </div>
                <h3 className="text-xl font-black text-white">No conversions yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Upload your first wireframe and the system will create a reusable code workspace.
                </p>
                <Link href="/convert" className="btn-primary mt-6 px-6 py-3 text-sm">
                  <Plus className="h-4 w-4" />
                  Create first conversion
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {conversions.map((conversion, i) => {
                  const created = toDate(conversion.createdAt);
                  const detectedCount = conversion.detectedComponents?.length || 0;
                  return (
                    <motion.div
                      key={conversion.id}
                      className="group flex flex-col gap-4 p-4 transition-all hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.035 }}
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045]">
                          {conversion.cloudinaryUrl ? (
                            <img src={conversion.cloudinaryUrl} alt="" className="h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <ImageIcon className="h-6 w-6 text-slate-600" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-black text-white sm:text-base">
                              {truncate(conversion.title || "Untitled Conversion", 48)}
                            </h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              conversion.status === "completed"
                                ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
                                : conversion.status === "failed"
                                  ? "border-red-300/18 bg-red-400/10 text-red-200"
                                  : "border-amber-300/18 bg-amber-400/10 text-amber-200"
                            }`}>
                              {conversion.status || "completed"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <FileCode className="h-3.5 w-3.5" />
                              {conversion.outputMode === "react-tailwind" ? "React + Tailwind" : "HTML/CSS"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Layers3 className="h-3.5 w-3.5" />
                              {detectedCount} components
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {created ? formatRelativeTime(conversion.createdAt) : "recently"}
                            </span>
                          </div>
                          {conversion.layoutDescription && (
                            <p className="mt-2 line-clamp-1 max-w-2xl text-xs leading-5 text-slate-500">
                              {truncate(conversion.layoutDescription, 140)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/convert/${conversion.id}`}
                          className="btn-secondary px-3 py-2 text-xs"
                          title="Open workbench"
                        >
                          <Eye className="h-4 w-4" />
                          Open
                        </Link>
                        <button
                          onClick={() => handleDelete(conversion.id)}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-500 transition-all hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
