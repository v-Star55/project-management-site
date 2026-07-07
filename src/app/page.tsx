"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Layers, 
  Clock, 
  Paperclip, 
  Lock, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Users, 
  Shield, 
  UserCheck, 
  ChevronRight,
  Terminal,
  CheckCircle2,
  Briefcase,
  Play,
  ArrowUpRight
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Multi-Tenant Workspaces",
    desc: "Register your company and spin up a dedicated, secure organizational workspace in seconds. Every team gets their own isolated environment.",
    span: "col-span-1 md:col-span-2",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Layers,
    title: "Drag & Drop Kanban",
    desc: "Fluid task management with real-time status updates across Todo, In Progress, In Review, and Blocked columns.",
    span: "col-span-1",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: Clock,
    title: "Advanced Time Logging",
    desc: "Track billable hours per task. Built for engineering teams who need accurate productivity metrics and client billing.",
    span: "col-span-1",
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Paperclip,
    title: "Task Attachments",
    desc: "Upload architectural diagrams, design specs, and logs directly to task cards. Everything in context.",
    span: "col-span-1",
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: Lock,
    title: "Role-Based Access Control",
    desc: "Granular permissions for Owners, Admins, Members, and Clients — each with a custom dashboard tailored to their responsibilities.",
    span: "col-span-1 md:col-span-2",
    color: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    icon: MessageSquare,
    title: "Integrated Messaging",
    desc: "Project-scoped comment threads keep communication contextual and searchable.",
    span: "col-span-1",
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
];

const roles = [
  {
    key: "owner",
    label: "Owner",
    icon: Building2,
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
    mockupTitle: "Company Workspace Management",
    mockupSubtitle: "Superuser settings panel",
    mockupDetails: [
      { label: "Tenant Isolation", val: "Active (SSL Encrypted)" },
      { label: "Billing Cycle", val: "Enterprise Annually" },
      { label: "Workspace State", val: "Enabled / Read-Write" }
    ]
  },
  {
    key: "admin",
    label: "Admin",
    icon: Shield,
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
    mockupTitle: "Project & Member Panel",
    mockupSubtitle: "Team velocity operations",
    mockupDetails: [
      { label: "Active Engineers", val: "14 / 20 Seats" },
      { label: "Velocity Index", val: "94.2% Sprint Target" },
      { label: "Sprint Backlog", val: "4 Active Projects" }
    ]
  },
  {
    key: "member",
    label: "Member",
    icon: UserCheck,
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
    mockupTitle: "My Work & Timesheets",
    mockupSubtitle: "Personal productivity HUD",
    mockupDetails: [
      { label: "Assigned Tickets", val: "5 In-Progress" },
      { label: "Time Logged Today", val: "6.5 hrs / 8.0 hrs" },
      { label: "Last Sync", val: "Just now" }
    ]
  },
  {
    key: "client",
    label: "Client",
    icon: Users,
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
    mockupTitle: "Client Review Portal",
    mockupSubtitle: "Milestone transparency view",
    mockupDetails: [
      { label: "Current Sprint Status", val: "88% Completed" },
      { label: "Next Milestone", val: "Beta Release July 15" },
      { label: "Feedback Requests", val: "0 Actions Required" }
    ]
  },
];

const metrics = [
  { value: "40%", label: "Engineering Velocity Increase", desc: "Average acceleration in release speed" },
  { value: "4 Roles", label: "Granular Access Levels", desc: "Tailored dashboards for all stakeholders" },
  { value: "99.99%", label: "High Availability", desc: "Enterprise uptime database clustering" },
  { value: "∞", label: "Limitless Scaling", desc: "Create unlimited projects & work streams" },
];

export default function Home() {
  const [activeRole, setActiveRole] = useState("member");
  const [scrolled, setScrolled] = useState(false);
  const [rotation, setRotation] = useState({ x: 5, y: -10 });

  // Mouse move handler for Hero Mockup 3D tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Cap rotation between -15 and 15 degrees
    const factor = 10;
    setRotation({
      x: -(y / (box.height / 2)) * factor,
      y: (x / (box.width / 2)) * factor,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 5, y: -10 });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = roles.find((r) => r.key === activeRole)!;

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans overflow-x-hidden relative selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Dynamic Background Mesh / Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[130px] animate-float-slow opacity-70" />
        <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[140px] animate-float-reverse opacity-60" />
        <div className="absolute bottom-[20%] left-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-float-slow opacity-50" />
        
        {/* Grid System overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* FLOATING NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 md:px-8 py-4">
        <nav className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full border transition-all duration-300 ${
          scrolled 
            ? "border-white/10 bg-[#050505]/75 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)]" 
            : "border-white/5 bg-transparent"
        }`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-sm font-extrabold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse-glow">
              R
            </div>
            <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              RELAY - MOVE THE WORK FORWARD
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors relative group py-1">
              Features
            </a>
            <a href="#roles" className="text-zinc-400 hover:text-white transition-colors relative group py-1">
              Roles
            </a>
            <a href="#metrics" className="text-zinc-400 hover:text-white transition-colors relative group py-1">
              Platform
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/company"
              className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
            >
              Create Workspace
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-40 pb-20 max-w-7xl mx-auto">
        {/* Animated Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs font-semibold text-emerald-400 mb-8 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/40 transition-colors duration-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgb(52,211,153)]" />
          <span>SaaS Engine Redefined for Architects & Engineers</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* Cinematic Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] max-w-5xl mb-6 animate-fade-in-up">
          Where Elite Teams
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
            Build the Future
          </span>
        </h1>

        <p className="text-zinc-400 text-base md:text-xl max-w-3xl leading-relaxed mb-12 animate-fade-in-up delay-100">
          Unlock speed. A premium multi-tenant hub with high-fidelity Kanban boards, 
          precise engineering logs, and secure access systems built for modern product delivery.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-24 animate-fade-in-up delay-200">
          <Link
            href="/company"
            className="group px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(16,185,129,0.25)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.45)] hover:-translate-y-1 flex items-center gap-2"
          >
            Register Your Company
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-sm transition-all duration-300 hover:-translate-y-1 hover:text-white"
          >
            Explore Demo Space
          </Link>
        </div>

        {/* Interactive 3D Mockup */}
        <div className="relative w-full max-w-5xl mx-auto perspective-1200 px-2 sm:px-6 md:px-0 animate-scale-in delay-300">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent rounded-3xl blur-2xl opacity-70 -z-10" />
          <div 
            className="rounded-2xl border border-white/10 bg-[#0e0e0e]/80 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 ease-out cursor-pointer hover:border-emerald-500/30"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header Mockup */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="ml-4 text-[11px] text-zinc-500 font-mono tracking-wider uppercase">Console // Workspace.Alpha // Boards</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">LIVE METRICS ACTIVE</span>
              </div>
            </div>

            {/* Kanban Board Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 md:p-8 text-left">
              {[
                {
                  col: "Todo",
                  count: 2,
                  color: "border-zinc-800 text-zinc-400",
                  bg: "bg-zinc-500/10",
                  cards: [
                    { title: "Configure SSL & Auth Handlers", priority: "critical", time: "0 / 12h", icon: Shield },
                    { title: "Design Landing Page Redesign", priority: "high", time: "0 / 8h", icon: Sparkles },
                  ],
                },
                {
                  col: "In Progress",
                  count: 2,
                  color: "border-blue-500/30 text-blue-400",
                  bg: "bg-blue-400/10",
                  cards: [
                    { title: "Implement Multi-Tenant Middleware", priority: "critical", time: "6.5 / 16h", icon: Building2 },
                    { title: "Time Logging Aggregates API", priority: "medium", time: "4.0 / 8h", icon: Clock },
                  ],
                },
                {
                  col: "Done",
                  count: 2,
                  color: "border-emerald-500/30 text-emerald-400",
                  bg: "bg-emerald-400/10",
                  cards: [
                    { title: "Prisma Schema Optimization", priority: "low", time: "3 / 3h", icon: Layers },
                    { title: "Real-time Comments Infrastructure", priority: "high", time: "8 / 8h", icon: MessageSquare },
                  ],
                },
              ].map((column) => (
                <div key={column.col} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{column.col}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${column.bg} ${column.color.split(" ")[1]}`}>{column.count}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {column.cards.map((card) => {
                      const CardIcon = card.icon;
                      return (
                        <div
                          key={card.title}
                          className="group/card rounded-xl border border-white/5 bg-[#121212]/60 hover:bg-[#161616]/80 p-4 transition-all duration-300 hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <p className="text-xs text-zinc-200 font-medium leading-relaxed group-hover/card:text-white transition-colors">{card.title}</p>
                            <CardIcon className="w-4 h-4 text-zinc-600 group-hover/card:text-emerald-400 transition-colors shrink-0" />
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                              card.priority === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              card.priority === "high" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-zinc-800 text-zinc-400"
                            }`}>
                              {card.priority}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {card.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY LOGO STRIP */}
      <section className="relative z-10 py-12 border-y border-white/5 bg-[#050505]/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest mb-6">Empowering Tech Teams Worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:opacity-50 transition-opacity duration-300">
            <span className="text-lg font-black tracking-tighter text-zinc-200">ACME CORP</span>
            <span className="text-lg font-black tracking-tighter text-zinc-200">APERTURE LOGIC</span>
            <span className="text-lg font-black tracking-tighter text-zinc-200">STARK NETWORKS</span>
            <span className="text-lg font-black tracking-tighter text-zinc-200">TYRELL TECH</span>
            <span className="text-lg font-black tracking-tighter text-zinc-200">HALO GLOBAL</span>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO GRID */}
      <section id="features" className="relative z-10 px-6 py-28 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-4 border border-emerald-500/20">
            CAPABILITIES
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Everything your team needs to deliver</h2>
          <p className="mt-4 text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">Designed for developers, structured for managers, customized for clients.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-white/5 bg-[#09090b]/80 p-8 transition-all duration-500 hover:border-white/15 hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,0,0,0.6)] ${f.span}`}
              >
                {/* Radial Glow on Hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-12 w-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center ${f.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">MODULE 0{i + 1}</span>
                </div>
                
                <h3 className="text-zinc-100 font-bold text-lg mb-3 tracking-tight group-hover:text-white transition-colors">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ROLE EXPLORER (SIDE-BY-SIDE INTERACTIVE LAYOUT) */}
      <section id="roles" className="relative z-10 px-6 py-28 bg-[#060606] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-[10px] font-bold tracking-widest text-violet-400 uppercase mb-4 border border-violet-500/20">
              ACCESS DEEP-DIVE
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">One workspace, four unique interfaces</h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              Dynamic layout rendering changes dashboard systems automatically depending on logged-in user permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Sidebar Selector */}
            <div className="lg:col-span-4 flex flex-col justify-center gap-3">
              {roles.map((r) => {
                const RoleIcon = r.icon;
                const isActive = activeRole === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setActiveRole(r.key)}
                    className={`flex items-center justify-between p-4 rounded-xl text-left border transition-all duration-300 ${
                      isActive 
                        ? "bg-[#111111] border-white/10 text-white shadow-lg" 
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#0b0b0b]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? "bg-zinc-800 text-emerald-400" : "bg-transparent text-zinc-600"}`}>
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{r.label}</div>
                        <div className="text-xs text-zinc-500 leading-none mt-1">{r.tagline}</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isActive ? "translate-x-1 opacity-100 text-emerald-400" : "opacity-0"}`} />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Preview Display */}
            <div className="lg:col-span-8 flex">
              <div className={`w-full relative rounded-2xl border ${role.border} bg-gradient-to-br ${role.color} p-8 flex flex-col md:flex-row gap-8 justify-between items-stretch overflow-hidden transition-all duration-300`}>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 ${role.badge}`}>
                      {role.label} LEVEL
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">{role.tagline}</h3>
                    
                    <ul className="mt-6 space-y-3.5">
                      {role.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-3 text-sm text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8 border-t border-white/5 mt-8">
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">
                      Preview Dashboard System
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Dashboard View Mock Card */}
                <div className="w-full md:w-72 bg-zinc-950/85 backdrop-blur-md rounded-xl border border-white/10 p-5 flex flex-col justify-between shrink-0 shadow-2xl relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">{role.mockupTitle}</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)]" />
                    </div>
                    <div className="text-xs text-zinc-400 font-semibold mb-4">{role.mockupSubtitle}</div>
                    
                    <div className="space-y-3 font-mono">
                      {role.mockupDetails.map((det) => (
                        <div key={det.label} className="text-[10px] flex justify-between">
                          <span className="text-zinc-600">{det.label}:</span>
                          <span className="text-zinc-300 font-bold">{det.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Security check</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold uppercase">Passed</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* METRICS COUNTER */}
      <section id="metrics" className="relative z-10 px-6 py-28 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div 
              key={m.label} 
              className="group relative text-left rounded-2xl border border-white/5 bg-[#09090b]/40 p-6 md:p-8 hover:border-emerald-500/20 hover:bg-[#0c0c0e]/80 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {m.value}
              </div>
              <div className="text-sm font-bold text-zinc-200 mb-1 tracking-tight">{m.label}</div>
              <p className="text-xs text-zinc-500 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IMMERSIVE CTA CARD */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto mb-16">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 p-12 md:p-16 text-center">
          
          {/* Vivid background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-zinc-950 -z-10" />
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />
          
          {/* Subtle Grid layer */}
          <div 
            className="absolute inset-0 opacity-[0.02] -z-10" 
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-6 border border-emerald-500/20">
              GET ACTIVE IN SPRINT SESSIONS
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Ready to accelerate your
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                development cycle?
              </span>
            </h2>
            
            <p className="text-zinc-400 text-sm md:text-base mb-10 leading-relaxed max-w-lg mx-auto">
              Create a dedicated workspace tenant for your organization, register managers & engineers, and launch development pipelines today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/company"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#030303] font-bold text-sm transition-all duration-300 shadow-[0_10px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.45)] hover:-translate-y-0.5"
              >
                Create Workspace
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
              >
                Sign In to Account
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050505] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 mb-12">
          
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-emerald-500/20">
                  R
                </div>
                <span className="font-extrabold text-sm tracking-widest text-white">RELAY - MOVE THE WORK FORWARD</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                A premium, multi-tenant B2B project & task management platform built to accelerate agile cycles for engineering teams.
              </p>
            </div>
            <p className="text-[10px] text-zinc-700 font-mono mt-8 hidden md:block">
              © {new Date().getFullYear()} Relay - Move The Work Forward. All rights reserved.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
              <a href="#roles" className="hover:text-zinc-300 transition-colors">Roles Explorer</a>
              <a href="#metrics" className="hover:text-zinc-300 transition-colors">Metrics</a>
            </div>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Architecture Stack</h4>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Modern micro-transaction layers managed securely on Next.js, Prisma, PostgreSQL, and Supabase client structures.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <Link href="/login" className="hover:text-zinc-300 transition-colors font-semibold">Sign In</Link>
              <span className="text-zinc-800">|</span>
              <Link href="/company" className="hover:text-zinc-300 transition-colors font-semibold">Get Started</Link>
            </div>
          </div>

          <p className="text-[10px] text-zinc-700 font-mono mt-4 md:hidden block">
            © {new Date().getFullYear()} Relay - Move The Work Forward. All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
}
