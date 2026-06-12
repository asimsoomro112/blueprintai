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
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLanding = pathname === "/";

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/convert", label: "New Conversion", icon: Upload },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    : [];

  return (
    <div className="w-full sticky top-0 z-50 px-4 sm:px-6 pt-4 pb-2 pointer-events-none">
      <header className="mx-auto max-w-7xl pointer-events-auto backdrop-blur-3xl bg-[#0b0f19]/55 border border-white/[0.08] rounded-2xl sm:rounded-full px-5 sm:px-6 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),_0_12px_40px_-6px_rgba(0,0,0,0.7)] flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/35 blur-md rounded-xl sm:rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 p-2 rounded-xl sm:rounded-full shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent transition-all duration-300 group-hover:text-blue-200">
            BlueprintAI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    active ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),_0_2px_12px_rgba(255,255,255,0.03)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
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

        {/* Landing page nav */}
        {isLanding && !user && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-gray-400">
            <a href="#features" className="hover:text-white transition-colors relative py-1 group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors relative py-1 group">
              How it Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#use-cases" className="hover:text-white transition-colors relative py-1 group">
              Use Cases
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
            </a>
          </nav>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user.displayName?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate font-semibold text-gray-200">{user.displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-52 backdrop-blur-3xl bg-[#0b0f19]/85 border border-white/[0.08] p-2.5 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_12px_40px_rgba(0,0,0,0.65)]"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1.5">
                      <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 rounded-xl hover:bg-white/[0.05] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-gray-400" /> Settings
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full btn-glow transition-all hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-blue-500/15"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              className="md:hidden p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.05]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="md:hidden mt-2 mx-auto max-w-7xl pointer-events-auto backdrop-blur-3xl bg-[#0b0f19]/75 border border-white/[0.08] rounded-2xl p-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),_0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-white/[0.08] text-white border border-white/[0.05]"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
