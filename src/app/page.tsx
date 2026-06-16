"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Eye,
  Code2,
  Smartphone,
  Cloud,
  History,
  FileArchive,
  Palette,
  ArrowRight,
  Upload,
  Cpu,
  MonitorPlay,
  Download,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Users,
  Trophy,
  Wand2,
  Layers3,
  TerminalSquare,
  Braces,
  Gauge,
  MousePointerClick,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.56, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Eye,
    title: "Vision-first sketch detection",
    desc: "Gemini reads navbars, sidebars, cards, grids, forms, footers, annotations, spacing, and hierarchy from rough wireframes.",
    accent: "from-blue-400/22 to-cyan-400/5 text-blue-200 border-blue-300/18",
  },
  {
    icon: Braces,
    title: "React + Tailwind or HTML",
    desc: "Generate clean TSX or standalone HTML/CSS/JS with semantic structure, responsive layouts, and readable naming.",
    accent: "from-indigo-400/22 to-blue-400/5 text-indigo-200 border-indigo-300/18",
  },
  {
    icon: MonitorPlay,
    title: "Live preview workbench",
    desc: "Sandpack renders React output immediately while the HTML mode uses a safe iframe preview for quick validation.",
    accent: "from-cyan-400/22 to-sky-400/5 text-cyan-200 border-cyan-300/18",
  },
  {
    icon: Palette,
    title: "Premium UI polish",
    desc: "Bento cards, modern glass surfaces, dark mode maturity, micro-interactions, and accessible focus states.",
    accent: "from-violet-400/22 to-fuchsia-400/5 text-violet-200 border-violet-300/18",
  },
  {
    icon: Cloud,
    title: "Cloud asset pipeline",
    desc: "Sketches upload to Cloudinary, while conversions can be saved to Firestore or local fallback in demo mode.",
    accent: "from-sky-400/22 to-cyan-400/5 text-sky-200 border-sky-300/18",
  },
  {
    icon: History,
    title: "Conversion history",
    desc: "Every output gets a reusable workspace with metadata, components, confidence score, warnings, and export tools.",
    accent: "from-emerald-400/22 to-teal-400/5 text-emerald-200 border-emerald-300/18",
  },
  {
    icon: FileArchive,
    title: "Ready-to-run ZIP export",
    desc: "Download generated code as a structured project with package files and configs for quick lab submission.",
    accent: "from-amber-400/22 to-orange-400/5 text-amber-200 border-amber-300/18",
  },
  {
    icon: Smartphone,
    title: "Responsive by default",
    desc: "The output and app shell are optimized for desktop lab screens, tablets, and mobile review.",
    accent: "from-rose-400/22 to-pink-400/5 text-rose-200 border-rose-300/18",
  },
];

const modules = [
  { icon: Upload, title: "Upload Studio", desc: "Drag/drop sketch intake, compression, output mode selection, and AI readiness checks." },
  { icon: Wand2, title: "AI Generator", desc: "Vision prompt engineered for faithful reconstruction before visual enhancement." },
  { icon: TerminalSquare, title: "Workbench", desc: "Original sketch, detected modules, AI edit chat, Monaco code editor, and live preview." },
  { icon: Download, title: "Export Layer", desc: "Copy, save edits, regenerate, and export full project ZIP for submission." },
];

const steps = [
  { icon: Upload, title: "Upload sketch", desc: "Photo, screenshot, or scanned hand-drawn wireframe." },
  { icon: Cpu, title: "AI reconstructs", desc: "Detects layout blocks and preserves drawn modules." },
  { icon: Code2, title: "Code appears", desc: "React/Tailwind or HTML/CSS/JS output is generated." },
  { icon: MonitorPlay, title: "Preview & refine", desc: "Edit manually or ask AI for targeted changes." },
  { icon: FileArchive, title: "Export project", desc: "Download complete ZIP and submit confidently." },
];

const useCases = [
  { icon: GraduationCap, title: "Lab submissions", desc: "Turn Web Engineering wireframes into a presentable working prototype." },
  { icon: Briefcase, title: "Client prototypes", desc: "Freelancers can demonstrate a design direction in minutes." },
  { icon: Users, title: "Team ideation", desc: "Convert whiteboard layouts into starter frontend code for teams." },
  { icon: Trophy, title: "Hackathons", desc: "Ship faster when time matters and design needs to look polished." },
];

export default function LandingPage() {
  return (
    <div className="premium-shell min-h-screen">
      <div className="aurora-field" />

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-20">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="pill">
            <Sparkles className="h-3.5 w-3.5" />
            2026 Premium AI Interface
          </span>
        </motion.div>

        <motion.h1
          className="mx-auto mt-7 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          Sketch your idea.
          <br />
          <span className="gradient-text">Generate a polished website.</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          BlueprintAI converts hand-drawn wireframes into refined frontend code with a premium
          dashboard, live preview, AI refinement, and export workflow built for serious lab demos.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <Link href="/convert" className="btn-primary px-7 py-3.5 text-sm">
            <Upload className="h-4 w-4" />
            Start conversion
          </Link>
          <a href="#workflow" className="btn-secondary px-7 py-3.5 text-sm">
            View workflow
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        <motion.div
          className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-[2rem] border border-white/[0.10] bg-white/[0.035] p-2 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 42, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.42, duration: 0.72, ease: "easeOut" }}
        >
          <div className="mesh-gradient rounded-[1.45rem] border border-white/[0.08] p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/85" />
                <span className="h-3 w-3 rounded-full bg-amber-300/85" />
                <span className="h-3 w-3 rounded-full bg-emerald-300/85" />
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1 text-[11px] font-bold text-slate-300 sm:flex">
                <span className="status-dot" />
                Live AI workbench
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.1fr_1.25fr]">
              <div className="rounded-3xl border border-dashed border-blue-300/20 bg-blue-950/20 p-5 text-left">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/75">Input sketch</span>
                  <Upload className="h-4 w-4 text-blue-200" />
                </div>
                <div className="space-y-3 rounded-2xl bg-white/[0.04] p-4">
                  <div className="h-7 w-28 rounded-lg bg-white/18" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-5 rounded-md bg-white/10" />
                    <div className="h-5 rounded-md bg-white/10" />
                    <div className="h-5 rounded-md bg-white/10" />
                  </div>
                  <div className="mt-5 grid grid-cols-[1.4fr_0.8fr] gap-3">
                    <div className="space-y-2">
                      <div className="h-20 rounded-xl border border-white/10 bg-white/[0.08]" />
                      <div className="h-16 rounded-xl border border-white/10 bg-white/[0.055]" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-10 rounded-xl bg-white/[0.07]" />
                      <div className="h-28 rounded-xl bg-white/[0.045]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-300/16 bg-cyan-400/[0.045] p-5 text-left">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">AI analysis pipeline</p>
                    <p className="text-xs text-slate-400">Detect → structure → style → export</p>
                  </div>
                </div>
                {["Layout hierarchy", "Component naming", "Responsive grid", "Accessibility checks"].map((item, index) => (
                  <div key={item} className="mb-2 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
                    <span className="text-xs font-bold text-slate-300">{item}</span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-200">
                      {index === 0 ? "ready" : "queued"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="code-window text-left">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                  <span className="font-mono text-xs font-bold text-cyan-100">App.tsx</span>
                  <span className="rounded-full bg-blue-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-200">Generated</span>
                </div>
                <div className="space-y-2 p-4 font-mono text-[12px] leading-6 text-slate-300">
                  <p><span className="text-violet-300">export default</span> <span className="text-cyan-200">function</span> App() {"{"}</p>
                  <p className="pl-4"><span className="text-violet-300">return</span> (</p>
                  <p className="pl-8 text-blue-200">&lt;main className="min-h-screen ..."&gt;</p>
                  <p className="pl-12 text-slate-300">&lt;Hero /&gt; &lt;BentoGrid /&gt;</p>
                  <p className="pl-8 text-blue-200">&lt;/main&gt;</p>
                  <p className="pl-4">);</p>
                  <p>{"}"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl border-t border-white/[0.07] px-4 py-18 sm:px-6 sm:py-24">
        <motion.div className="mx-auto mb-12 max-w-2xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Capabilities</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Built like a modern AI SaaS product</h2>
          <p className="mt-4 text-slate-400">No plain student-project look. The interface now uses premium surfaces, clearer hierarchy, and conversion-focused modules.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                className="bento-card p-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${feature.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="relative mx-auto max-w-7xl border-t border-white/[0.07] px-4 py-18 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <span className="pill">
              <MousePointerClick className="h-3.5 w-3.5" />
              Workflow
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">From rough sketch to presentable project ZIP</h2>
            <p className="mt-4 max-w-xl text-slate-400">
              The product flow is intentionally simple for lab demos: upload, generate, preview, refine, export.
              Each step is visible so your evaluator can understand the system architecture quickly.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {["Gemini Vision", "Cloudinary Upload", "Firestore History", "Monaco Editor", "Sandpack Preview"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="premium-card flex items-center gap-4 p-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl border border-blue-300/15 bg-blue-400/10 text-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">
                      <span className="mr-2 text-cyan-300">0{i + 1}</span>
                      {step.title}
                    </p>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-600 sm:block" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modules" className="relative mx-auto max-w-7xl border-t border-white/[0.07] px-4 py-18 sm:px-6 sm:py-24">
        <motion.div className="mb-12 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">Modules</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Everything your lab project needs</h2>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-4">
          {modules.map((module, i) => {
            const Icon = module.icon;
            return (
              <motion.div key={module.title} className="bento-card p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Icon className="h-7 w-7 text-cyan-200" />
                <h3 className="mt-5 text-lg font-black text-white">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{module.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div className="bento-card p-6 sm:p-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="pill"><Gauge className="h-3.5 w-3.5" /> Quality checklist</span>
                <h3 className="mt-4 text-2xl font-black text-white">Polished enough to present</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  This redesign improves first impression, spacing, information architecture, and perceived product completeness without changing your core backend.
                </p>
              </div>
              <Link href="/signup" className="btn-primary px-5 py-3 text-sm">
                Try it now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div className="bento-card p-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            {["Responsive shell", "Accessible focus", "Premium dark theme", "AI edit workflow"].map((item) => (
              <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-bold text-slate-300">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl border-t border-white/[0.07] px-4 py-18 sm:px-6 sm:py-24">
        <div className="grid gap-4 md:grid-cols-4">
          {useCases.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article key={item.title} className="soft-panel p-5" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Icon className="h-6 w-6 text-blue-200" />
                <h3 className="mt-4 font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-24 text-center sm:px-6">
        <div className="premium-card overflow-hidden p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-cyan-500/8 to-violet-500/12" />
          <div className="relative">
            <Layers3 className="mx-auto h-10 w-10 text-cyan-200" />
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">Ready to upgrade your project UI?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Upload one sketch, generate a complete webpage, refine it, then export the final code.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/convert" className="btn-primary px-7 py-3.5 text-sm">
                Launch studio
              </Link>
              <Link href="/login" className="btn-secondary px-7 py-3.5 text-sm">
                Open account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
