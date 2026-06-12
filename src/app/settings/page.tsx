"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Save,
  CheckCircle2,
  Shield,
  Cloud,
  Cpu,
  AlertTriangle,
  Sparkles,
  Loader2,
  Database,
  KeyRound,
  Server,
  Settings2,
  Wand2,
  Code2,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/client";

function SettingsContent() {
  const { user, updateUserDisplayName, isDemo } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    firebaseAdmin: false,
    cloudinary: false,
    gemini: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        const res = await fetch("/api/diagnostics");
        const json = await res.json();
        if (json.success) {
          setDiagnostics({
            firebaseAdmin: json.data.firebaseAdmin,
            cloudinary: json.data.cloudinary,
            gemini: json.data.gemini,
            loading: false,
          });
        } else {
          setDiagnostics((previous) => ({ ...previous, loading: false }));
        }
      } catch (err) {
        console.error("Error fetching diagnostics:", err);
        setDiagnostics((previous) => ({ ...previous, loading: false }));
      }
    }

    fetchDiagnostics();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      await updateUserDisplayName(name.trim());
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const statusItems = [
    {
      label: "Firebase Client & Auth",
      connected: isFirebaseConfigured(),
      icon: Shield,
      detail: isFirebaseConfigured() ? "Authentication is connected" : "Missing public Firebase keys",
      requirement: "NEXT_PUBLIC_FIREBASE_*",
    },
    {
      label: "Firebase Admin & Firestore",
      connected: diagnostics.firebaseAdmin,
      icon: Database,
      detail: diagnostics.firebaseAdmin ? "Server-side database is connected" : "Missing Admin SDK service keys",
      requirement: "FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY",
    },
    {
      label: "Cloudinary Image Upload",
      connected: diagnostics.cloudinary,
      icon: Cloud,
      detail: diagnostics.cloudinary ? "Uploads are connected" : "Uploads will fail until keys are added",
      requirement: "CLOUDINARY_*",
    },
    {
      label: "Gemini Vision AI",
      connected: diagnostics.gemini,
      icon: Cpu,
      detail: diagnostics.gemini ? "AI conversion is connected" : "Mock generation fallback will be used",
      requirement: "GEMINI_API_KEY",
    },
  ];

  return (
    <div className="premium-shell min-h-[calc(100vh-76px)] overflow-hidden">
      <div className="aurora-field" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="premium-card mb-6 overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-cyan-500/5 to-violet-500/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="pill">
                <Settings2 className="h-3.5 w-3.5" />
                System control center
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">Settings & integrations</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Manage profile details, verify API keys, and confirm the services required for a complete lab demo.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Current mode</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                <span className={isDemo ? "h-2.5 w-2.5 rounded-full bg-amber-300" : "status-dot"} />
                {isDemo ? "Demo / local" : "Cloud connected"}
              </p>
            </div>
          </div>
        </motion.div>

        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-300/18 bg-amber-400/10 p-4"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-200" />
            <div>
              <p className="text-sm font-black text-amber-100">Demo mode active</p>
              <p className="mt-1 text-xs leading-6 text-amber-100/72">
                Firebase keys are not configured, so the app is using simulated authentication and local storage.
                Add keys in <code className="rounded bg-black/20 px-1.5 py-0.5">.env.local</code> for full cloud behavior.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="premium-card p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Profile</h2>
                <p className="text-xs text-slate-500">Update your visible account identity</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Display name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] px-4 py-3.5 text-sm text-white placeholder:text-slate-600"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Email</span>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-sm text-slate-500"
                />
              </label>

              <button onClick={handleSave} disabled={saving} className="btn-primary px-5 py-3 text-sm disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="mt-6 rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Recommended demo route</p>
              {[
                { icon: Wand2, label: "Upload a clean sketch" },
                { icon: Code2, label: "Show generated React/HTML" },
                { icon: Server, label: "Open diagnostics here" },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.035] px-3 py-2.5">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    <span className="text-xs font-bold text-slate-300">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card overflow-hidden">
            <div className="border-b border-white/[0.08] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Integration status</h2>
                  <p className="text-xs text-slate-500">API connection diagnostics from your server route</p>
                </div>
              </div>
            </div>

            {diagnostics.loading ? (
              <div className="grid place-items-center p-14">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-300" />
                  <p className="mt-4 text-sm font-bold text-slate-400">Running diagnostics...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-5 sm:p-6">
                {statusItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${
                            item.connected ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{item.label}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                          </div>
                        </div>

                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${
                            item.connected
                              ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
                              : "border-red-300/18 bg-red-400/10 text-red-200"
                          }`}
                        >
                          {item.connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          {item.connected ? "Ready" : "Offline"}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2">
                        <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                        <code className="text-[11px] font-bold text-slate-500">{item.requirement}</code>
                      </div>
                    </div>
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

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
