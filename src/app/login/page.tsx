"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Wand2,
  Code2,
  MonitorPlay,
} from "lucide-react";

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-300" />
          <span className="mt-4 block text-sm font-bold">Checking session...</span>
        </div>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Google login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="premium-shell min-h-[calc(100vh-76px)] overflow-hidden px-4 py-10 sm:px-6">
      <div className="aurora-field" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-140px)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.86fr]">
        <motion.section
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          <span className="pill">
            <Sparkles className="h-3.5 w-3.5" />
            BlueprintAI account
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-white">
            Return to your
            <span className="gradient-text"> AI code workbench.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
            Continue generating, refining, previewing, and exporting sketch-to-code projects with a polished premium interface.
          </p>

          <div className="mt-8 grid max-w-xl gap-3">
            {[
              { icon: Wand2, title: "AI refinement", desc: "Ask for targeted design and code changes." },
              { icon: MonitorPlay, title: "Live preview", desc: "Validate React or HTML output instantly." },
              { icon: Code2, title: "Exportable code", desc: "Download clean project files for submission." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="premium-card flex items-center gap-4 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card mx-auto w-full max-w-md overflow-hidden p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/12 via-transparent to-cyan-500/8" />

          <div className="relative">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[1.2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue to BlueprintAI</p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="btn-secondary w-full px-4 py-3 text-sm disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">or email</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">Password</span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-3.5 text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to BlueprintAI?{" "}
              <Link href="/signup" className="font-black text-blue-300 hover:text-blue-200">
                Create account <ArrowRight className="inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
