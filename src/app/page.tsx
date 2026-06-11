"use client";

import { useState } from "react";
import Link from "next/link";

const features = [
  {
    icon: "🏢",
    title: "Multi-Tenant Workspaces",
    desc: "Register your company and spin up a dedicated, secure organizational workspace in seconds. Every team gets their own isolated environment.",
    span: "col-span-2",
  },
  {
    icon: "📋",
    title: "Drag & Drop Kanban",
    desc: "Fluid task management with real-time status updates across Todo, In Progress, In Review, and Blocked columns.",
    span: "col-span-1",
  },
  {
    icon: "⏱️",
    title: "Advanced Time Logging",
    desc: "Track billable hours per task. Built for engineering teams who need accurate productivity metrics and client billing.",
    span: "col-span-1",
  },
  {
    icon: "📎",
    title: "Task Attachments",
    desc: "Upload architectural diagrams, design specs, and logs directly to task cards. Everything in context.",
    span: "col-span-1",
  },
  {
    icon: "🔐",
    title: "Role-Based Access Control",
    desc: "Granular permissions for Owners, Admins, Members, and Clients — each with a custom dashboard tailored to their responsibilities.",
    span: "col-span-2",
  },
  {
    icon: "💬",
    title: "Integrated Messaging",
    desc: "Project-scoped comment threads keep communication contextual and searchable.",
    span: "col-span-1",
  },
];

const roles = [
  {
    key: "owner",
    label: "🏢 Owner",
    tagline: "The Workspace Architect",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/30",
    badge: "bg-violet-500/20 text-violet-300",
    perks: [
      "Full workspace settings control",
      "Subscription & billing management",
      "Company branding configuration",
      "Workspace activation / deactivation",
    ],
  },
  {
    key: "admin",
    label: "⚙️ Admin",
    tagline: "The Delivery Manager",
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300",
    perks: [
      "Register & manage team members",
      "Create and assign projects",
      "View org-chart hierarchies",
      "Generate performance reports",
    ],
  },
  {
    key: "member",
    label: "💻 Member",
    tagline: "The Builder",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300",
    perks: [
      "Manage assigned task boards",
      "Log daily working hours",
      "Upload task attachments",
      "Collaborate via comments",
    ],
  },
  {
    key: "client",
    label: "🤝 Client",
    tagline: "The Strategic Partner",
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300",
    perks: [
      "Read-only project boards",
      "Filter by project scope",
      "View delivery progress",
      "Isolated secure access",
    ],
  },
];

const metrics = [
  { value: "40%", label: "Engineering Velocity Increase" },
  { value: "4 Roles", label: "Granular Access Levels" },
  { value: "99.9%", label: "Uptime via Supabase + PostgreSQL" },
  { value: "∞", label: "Projects per Workspace" },
];

export default function Home() {
  const [activeRole, setActiveRole] = useState("member");
  const role = roles.find((r) => r.key === activeRole)!;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-md bg-[#09090b]/80">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
            H
          </div>
          <span className="font-semibold text-sm tracking-wide text-zinc-100">
            The House of Engineers
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#roles" className="hover:text-zinc-100 transition-colors">Roles</a>
          <a href="#metrics" className="hover:text-zinc-100 transition-colors">Platform</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/company"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            Create Workspace
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Built for engineering teams · Multi-tenant SaaS
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mb-6">
          Where Elite Teams
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Build the Future
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
          A premium, multi-tenant workspace with fluid Kanban boards, advanced time tracking, 
          role-based security, and native client portals — engineered for development velocity.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/company"
            className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            Register Your Company →
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-sm transition-all duration-200"
          >
            Explore Demo Accounts
          </Link>
        </div>

        {/* Hero Dashboard Mock */}
        <div className="relative mt-20 w-full max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent rounded-3xl" />
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-2xl">
            {/* Mock Kanban Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-zinc-900/80">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <span className="ml-4 text-xs text-zinc-500 font-medium">Dashboard · Project Alpha</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">In Progress</span>
              </div>
            </div>
            {/* Mock Kanban Board */}
            <div className="grid grid-cols-3 gap-4 p-6">
              {[
                {
                  col: "Todo",
                  color: "text-zinc-400",
                  cards: [
                    { title: "Setup CI/CD Pipeline", priority: "high", time: "0 / 8h" },
                    { title: "Write API Documentation", priority: "low", time: "0 / 4h" },
                  ],
                },
                {
                  col: "In Progress",
                  color: "text-blue-400",
                  cards: [
                    { title: "Implement OAuth2 Sign-In", priority: "high", time: "4.5 / 8h" },
                    { title: "Prisma DB Migrations", priority: "medium", time: "2 / 6h" },
                  ],
                },
                {
                  col: "Done",
                  color: "text-emerald-400",
                  cards: [
                    { title: "Custom Global Scrollbar", priority: "low", time: "1 / 1h" },
                    { title: "Kanban Drag & Drop", priority: "high", time: "8 / 8h" },
                  ],
                },
              ].map((column) => (
                <div key={column.col}>
                  <div className={`text-xs font-semibold mb-3 ${column.color}`}>
                    {column.col} · {column.cards.length}
                  </div>
                  <div className="flex flex-col gap-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-lg border border-white/5 bg-zinc-800/60 p-3 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-150 cursor-default"
                      >
                        <p className="text-xs text-zinc-200 font-medium leading-tight mb-2">{card.title}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            card.priority === "high" ? "bg-red-500/20 text-red-400" :
                            card.priority === "medium" ? "bg-amber-500/20 text-amber-400" :
                            "bg-zinc-500/20 text-zinc-400"
                          }`}>
                            {card.priority}
                          </span>
                          <span className="text-[10px] text-zinc-500">⏱ {card.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">Platform Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">Everything your team needs</h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto">From onboarding to delivery — built for engineering teams that move fast without breaking things.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-emerald-500/20 p-6 transition-all duration-300 hover:-translate-y-1 ${f.span === "col-span-2" ? "md:col-span-2" : ""}`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-zinc-100 font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLE EXPLORER */}
      <section id="roles" className="relative z-10 px-6 md:px-12 py-24 bg-zinc-900/30 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">Access Control</p>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">One platform, four roles</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto">Every stakeholder gets a purpose-built experience — no one sees more than they need to.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeRole === r.key
                    ? "bg-white/10 text-zinc-100 border border-white/20"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Role Card */}
          <div className={`relative rounded-2xl border ${role.border} bg-gradient-to-br ${role.color} p-8 transition-all duration-300`}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${role.badge}`}>
                  {role.label}
                </span>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">{role.tagline}</h3>
                <ul className="mt-5 space-y-3">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-sm text-zinc-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden md:block w-64 h-40 rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                <div className="p-4 text-center">
                  <div className="text-4xl mb-2">{role.label.split(" ")[0]}</div>
                  <p className="text-xs text-zinc-500">Dashboard view for</p>
                  <p className="text-xs font-semibold text-zinc-300">{role.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section id="metrics" className="relative z-10 px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="text-center rounded-2xl border border-white/5 bg-zinc-900/40 p-6 hover:border-emerald-500/20 hover:bg-zinc-900/70 transition-all duration-200 group">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2 group-hover:scale-105 transition-transform duration-200">
                {m.value}
              </div>
              <p className="text-xs text-zinc-400 leading-tight">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl border border-emerald-500/20 bg-zinc-900/60 backdrop-blur-sm p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
              Ready to optimize your<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                development lifecycle?
              </span>
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Create a company account today and experience the workspace built specifically for engineering teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/company"
                className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                Start Onboarding →
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-sm transition-all duration-200"
              >
                Sign In to Existing Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
              H
            </div>
            <span className="text-sm text-zinc-500">The House of Engineers</span>
          </div>
          <p className="text-xs text-zinc-600">
            Built with Next.js · Prisma · Supabase · TanStack Query · Tailwind CSS
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign In</Link>
            <Link href="/company" className="hover:text-zinc-400 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
