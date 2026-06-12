"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, BarChart3, CheckCircle2, CalendarDays, HardDrive,
  Eye, Trash2, ExternalLink, FileCode, Image as ImageIcon,
  Inbox
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { ConversionRecord } from "@/types";
import { formatRelativeTime, truncate, getCleanedConversions, safeSetLocalStorage } from "@/lib/utils";

function DashboardContent() {
  const { user, isDemo } = useAuth();
  const router = useRouter();
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      let localResults: ConversionRecord[] = [];
      localResults = getCleanedConversions();

      if (isDemo || !isFirebaseConfigured()) {
        setConversions(localResults);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "conversions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as ConversionRecord));

        // Merge firestore results and local results, filtering out duplicates
        const merged = [...results];
        localResults.forEach(lc => {
          if (!merged.some(mc => mc.id === lc.id)) {
            merged.push(lc);
          }
        });

        // Sort merged by createdAt descending
        merged.sort((a, b) => {
          const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bd = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bd.getTime() - ad.getTime();
        });

        setConversions(merged);
      } catch (err) {
        console.error("Error loading conversions:", err);
        setConversions(localResults); // fallback to local on Firestore error
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this conversion?")) return;
    try {
      if (!isDemo && isFirebaseConfigured()) {
        await deleteDoc(doc(db, "conversions", id));
      }
      const updated = conversions.filter(c => c.id !== id);
      setConversions(updated);

      // Clean up local storage index list and individual key
      const localCached = getCleanedConversions();
      const updatedLocal = localCached.filter((c: any) => c.id !== id);
      safeSetLocalStorage("blueprint_conversions", JSON.stringify(updatedLocal));
      localStorage.removeItem(`blueprint_conversion_${id}`);

      toast.success("Conversion deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const stats = [
    { icon: BarChart3, label: "Total Conversions", value: conversions.length, color: "blue" },
    { icon: CheckCircle2, label: "Successful", value: conversions.filter(c => c.status === "completed").length, color: "emerald" },
    {
      icon: CalendarDays, label: "This Month", value: conversions.filter(c => {
        const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length, color: "amber"
    },
    { icon: HardDrive, label: "Est. Storage", value: `${(conversions.length * 0.15).toFixed(1)} MB`, color: "purple" },
  ];

  const colorMap: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20",
    purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="min-h-[calc(100vh-60px)] max-w-7xl mx-auto px-4 sm:px-6 py-8 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="blob bg-blue-500 w-[500px] h-[500px] top-[-10%] left-[-20%] blob-animate-1" />
      <div className="blob bg-purple-500 w-[450px] h-[450px] bottom-[10%] right-[-15%] blob-animate-2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, {user?.displayName?.split(" ")[0] || "User"} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">Here&apos;s an overview of your conversions</p>
          </div>
          <Link
            href="/convert"
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl btn-glow transition-all hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 w-fit"
          >
            <Plus className="h-4 w-4" /> New Conversion
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const colors = colorMap[s.color];
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} border flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Conversions List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Conversions</h2>
            <span className="text-xs text-gray-500">{conversions.length} total</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : conversions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300">No conversions yet</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">Upload your first hand-drawn wireframe to generate code.</p>
              <Link
                href="/convert"
                className="mt-6 flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl btn-glow transition-all"
              >
                <Plus className="h-4 w-4" /> Start Converting
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {conversions.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-gray-800/60 border border-gray-700/40 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {c.cloudinaryUrl ? (
                      <img src={c.cloudinaryUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{truncate(c.title || "Untitled", 45)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FileCode className="h-3 w-3" />
                        {c.outputMode === "react-tailwind" ? "React" : "HTML/CSS"}
                      </span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{formatRelativeTime(c.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${c.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      c.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                    {c.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/convert/${c.id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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
