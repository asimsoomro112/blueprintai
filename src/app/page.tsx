"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Eye, Code, Smartphone, Cloud, History, FileArchive, Palette,
  ArrowRight, Upload, Cpu, MonitorPlay, Download, CheckCircle2,
  GraduationCap, Briefcase, Users, Zap, Trophy
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
  }),
};

const features = [
  { icon: Eye, title: "AI Sketch Detection", desc: "Gemini vision AI identifies buttons, forms, navbars, grids, cards, and layout structures from hand-drawn wireframes.", color: "blue" },
  { icon: Code, title: "React & HTML Generation", desc: "Instantly generates clean React + Tailwind CSS or standalone HTML/CSS/JS code from your sketch analysis.", color: "indigo" },
  { icon: MonitorPlay, title: "Live Browser Preview", desc: "See your generated code render in real-time with an embedded Sandpack browser preview sandbox.", color: "cyan" },
  { icon: Palette, title: "Monaco Code Editor", desc: "Edit generated code with full syntax highlighting, IntelliSense, and multiple file tab support.", color: "purple" },
  { icon: Cloud, title: "Cloudinary Storage", desc: "All uploaded sketch images are securely stored on Cloudinary with automatic optimization.", color: "sky" },
  { icon: History, title: "Firebase History", desc: "Every conversion is saved to your Firestore profile, so you can revisit and iterate on past sketches.", color: "emerald" },
  { icon: FileArchive, title: "ZIP Project Export", desc: "Download your generated code as a complete, ready-to-run project ZIP with package.json and configs.", color: "amber" },
  { icon: Smartphone, title: "Responsive Output", desc: "Generated code uses responsive Tailwind utilities and media queries to work on all screen sizes.", color: "rose" },
];

const steps = [
  { icon: Upload, title: "Upload Sketch", desc: "Take a photo of your hand-drawn wireframe and upload it." },
  { icon: Cpu, title: "AI Analyzes", desc: "Gemini vision model detects layout, components, and structure." },
  { icon: Code, title: "Generate Code", desc: "Clean React/Tailwind or HTML/CSS code is generated instantly." },
  { icon: MonitorPlay, title: "Live Preview", desc: "See your code rendered in a live browser sandbox." },
  { icon: Download, title: "Export & Ship", desc: "Copy code, edit inline, or export as a complete ZIP project." },
];

const useCases = [
  { icon: GraduationCap, title: "Students", desc: "Convert assignment wireframes to working code in minutes for lab submissions." },
  { icon: Briefcase, title: "Freelancers", desc: "Rapidly prototype client mockups from napkin sketches during meetings." },
  { icon: Users, title: "Dev Teams", desc: "Accelerate sprint kickoffs by converting whiteboard designs to starter code." },
  { icon: Zap, title: "Hackathons", desc: "Go from idea sketch to working prototype in under 5 minutes." },
  { icon: Trophy, title: "Designers", desc: "Validate layout concepts by seeing them rendered instantly as real web pages." },
];

const colorMap: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20",
  indigo: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20",
  cyan: "from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/20",
  purple: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20",
  sky: "from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/20",
  emerald: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
  amber: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20",
  rose: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20",
};

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="blob bg-blue-500 w-[600px] h-[600px] top-[-200px] left-[-100px] blob-animate-1" />
      <div className="blob bg-indigo-500 w-[500px] h-[500px] top-[20%] right-[-150px] blob-animate-2" />
      <div className="blob bg-cyan-500 w-[400px] h-[400px] top-[60%] left-[10%] blob-animate-1" />

      {/* ─── HERO ─── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold tracking-wider text-blue-300 uppercase bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Sketch Conversion
          </span>
        </motion.div>

        <motion.h1
          className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Turn hand-drawn sketches
          <br />
          <span className="gradient-text">into production-ready web code</span>
        </motion.h1>

        <motion.p
          className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          Upload a photo of your wireframe. Our Gemini AI vision engine analyzes the layout and generates
          clean React + Tailwind or HTML/CSS code with a live browser preview — all in seconds.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
        >
          <Link
            href="/convert"
            className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl btn-glow transition-all hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
          >
            <Upload className="h-4 w-4" /> Upload Sketch
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-gray-300 glass-card-light hover:bg-white/5 transition-all"
          >
            Watch Demo <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Visual mockup area */}
        <motion.div
          className="mt-16 mx-auto max-w-4xl glass-card p-1 glow-blue"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <div className="bg-[#0a0f1e] rounded-[0.85rem] p-6 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Sketch card */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-[4/3] bg-gray-800/60 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-500 mx-auto" />
                    <p className="text-xs text-gray-500 mt-2">Paper Sketch</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Input</span>
              </div>

              {/* Arrow / AI */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Gemini AI</span>
                <div className="hidden sm:flex items-center gap-1 text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Output card */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <Code className="h-8 w-8 text-blue-400 mx-auto" />
                    <p className="text-xs text-blue-400 mt-2">Live Website</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Output</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-gray-800/50">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Capabilities</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Everything you need, built in</h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">A complete sketch-to-code pipeline with enterprise-grade features — all on the free tier.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            const colors = colorMap[f.color] || colorMap.blue;
            return (
              <motion.div
                key={f.title}
                className="glass-card p-6 hover:border-gray-600/60 transition-all group"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors} border flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 border-t border-gray-800/50">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Workflow</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">How it works</h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">Five simple steps from paper sketch to deployable code.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                className="flex flex-col items-center text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section id="use-cases" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-gray-800/50">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Who it&apos;s for</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Built for builders</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.title}
                className="glass-card-light p-5 text-center hover:border-gray-600/40 transition-all"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <Icon className="h-7 w-7 text-emerald-400 mx-auto" />
                <h3 className="mt-3 text-sm font-semibold text-white">{uc.title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{uc.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center border-t border-gray-800/50">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to convert your sketches?
          </h2>
          <p className="mt-4 text-gray-400 max-w-md mx-auto">
            Start building faster. No credit card required. Free tier includes 10 daily conversions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl btn-glow transition-all shadow-lg shadow-blue-500/25"
            >
              <Sparkles className="h-4 w-4" /> Create Free Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> 100% free · No paid APIs · University project ready
          </p>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">BlueprintAI</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 BlueprintAI · Web Engineering Lab Project · Sir Syed University</p>
        </div>
      </footer>
    </div>
  );
}
