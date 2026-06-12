"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutDashboard,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Wand2,
  ShieldCheck,
  Home,
} from "lucide-react";

const landingLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#modules", label: "Modules" },
];

export default function Navbar() {
  const { user, logout, isDemo } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLanding = pathname === "/";

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/convert", label: "Generate", icon: Wand2 },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    : [];

  return (
    <div className="pointer-events-none sticky top-0 z-50 w-full px-3 pb-2 pt-3 sm:px-6">
      <header className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-[#050a14]/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_60px_rgba(0,0,0,0.45)] backdrop-blur-3xl sm:rounded-full sm:px-4">
        <Link href={user ? "/dashboard" : "/"} className="group flex min-w-0 items-center gap-2.5">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg shadow-blue-500/10 transition-transform duration-300 group-hover:scale-105 sm:rounded-full">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 opacity-80 blur-[1px] sm:rounded-full" />
            <Sparkles className="relative h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-base font-black tracking-tight text-white sm:text-lg">
              BlueprintAI
            </span>
            <span className="-mt-1 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70 sm:block">
              Sketch to code studio
            </span>
          </div>
        </Link>

        {user && (
          <nav className="hidden items-center rounded-full border border-white/[0.06] bg-white/[0.035] p-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    active ? "text-white" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="premium-active-nav"
                      className="absolute inset-0 rounded-full border border-white/[0.09] bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        {isLanding && !user && (
          <nav className="hidden items-center gap-7 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 md:flex">
            {landingLinks.map((link) => (
              <a key={link.href} href={link.href} className="group relative py-2 hover:text-white">
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-bold text-emerald-200 lg:flex">
              <span className="status-dot" />
              {isDemo ? "Demo mode" : "Cloud synced"}
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-1.5 pr-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/[0.075]"
                aria-label="Open user menu"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-xs font-black text-white shadow-md shadow-blue-500/20">
                  {user.displayName?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.displayName || "User"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-3 w-64 rounded-3xl border border-white/[0.10] bg-[#07101f]/92 p-2.5 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-3xl"
                  >
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
                      <p className="truncate text-sm font-black text-white">{user.displayName || "BlueprintAI User"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        <ShieldCheck className="h-3 w-3" />
                        {isDemo ? "Local workspace" : "Authenticated"}
                      </div>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="mt-2 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-slate-400" /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-xs font-bold text-slate-300 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary px-4 py-2 text-xs">
                Start free
              </Link>
            </div>
          )}

          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.045] text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="pointer-events-auto mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#050a14]/86 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.48)] backdrop-blur-3xl md:hidden"
          >
            <nav className="grid gap-1">
              {user ? (
                navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        active
                          ? "border border-white/[0.08] bg-white/[0.08] text-white"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })
              ) : (
                <>
                  <a
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[0.05]"
                  >
                    <Home className="h-4 w-4" />
                    Features
                  </a>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[0.05]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary px-4 py-3 text-sm"
                  >
                    Start free
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
