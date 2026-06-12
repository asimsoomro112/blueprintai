"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";

export default function SignupPage() {
  const { signup, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium tracking-wide">Checking session...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Please fill in all fields");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setSubmitting(true);
    try {
      await signup(email, password, name);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
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
      toast.error(err.message || "Google signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12 relative">
      <div className="blob bg-indigo-500 w-[400px] h-[400px] top-[5%] right-[5%] blob-animate-1" />
      <div className="blob bg-blue-500 w-[350px] h-[350px] bottom-[15%] left-[10%] blob-animate-2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 sm:p-10 glow-blue">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm text-gray-400 mt-1">Start converting sketches to code</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-700 bg-white/5 text-sm font-medium text-gray-200 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-700/60" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-700/60" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Asim"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-semibold text-white btn-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
