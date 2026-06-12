"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Save, CheckCircle2, Shield, Cloud, Cpu,
  AlertTriangle, Sparkles, Loader2
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
          setDiagnostics((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error("Error fetching diagnostics:", err);
        setDiagnostics((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchDiagnostics();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      await updateUserDisplayName(name.trim());
      toast.success("Profile updated!");
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
      detail: isFirebaseConfigured() ? "Connected" : "Missing keys (simulated fallback)",
    },
    {
      label: "Firebase Admin & Firestore",
      connected: diagnostics.firebaseAdmin,
      icon: Shield,
      detail: diagnostics.firebaseAdmin ? "Connected server-side" : "Missing keys (simulated fallback)",
    },
    {
      label: "Cloudinary Image Upload",
      connected: diagnostics.cloudinary,
      icon: Cloud,
      detail: diagnostics.cloudinary ? "Connected" : "Not configured (using local base64 fallback)",
    },
    {
      label: "Gemini Vision AI",
      connected: diagnostics.gemini,
      icon: Cpu,
      detail: diagnostics.gemini ? "Connected" : "Not configured (using mock generation fallback)",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="blob bg-blue-500 w-[500px] h-[500px] top-[-10%] left-[-20%] blob-animate-1" />
      <div className="blob bg-purple-500 w-[450px] h-[450px] bottom-[10%] right-[-15%] blob-animate-2" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your account and integrations</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Demo Mode Active</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Firebase API keys are not configured. The app is running with simulated authentication and local storage.
                Configure your <code className="px-1 py-0.5 bg-amber-500/10 rounded">.env.local</code> to enable full functionality.
              </p>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Profile</h2>
              <p className="text-xs text-gray-500">Update your display name</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl btn-glow transition-all disabled:opacity-50"
            >
              {saving ? <Save className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Integration Status</h2>
              <p className="text-xs text-gray-500">API connection diagnostics</p>
            </div>
          </div>

          <div className="space-y-3">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-gray-700/40"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.detail}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.connected
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {item.connected ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {item.connected ? "Ready" : "Offline"}
                  </div>
                </div>
              );
            })}
          </div>
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
