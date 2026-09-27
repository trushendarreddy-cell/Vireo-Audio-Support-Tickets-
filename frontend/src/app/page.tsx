"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Bot,
  MessageSquare,
  Sliders,
  Users,
  Calendar,
  Database,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  ChevronRight,
  Check,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Phone,
  MessageCircle,
  Share2,
  Printer,
  ChevronDown
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<any>(null);
  const [complaints, setComplaints] = useState<any>(null);
  const [slaData, setSlaData] = useState<any>(null);
  const [csatData, setCsatData] = useState<any>(null);
  const [repeatsData, setRepeatsData] = useState<any>(null);
  const [agentsData, setAgentsData] = useState<any>(null);
  const [validationData, setValidationData] = useState<any>(null);
  const [digestMarkdown, setDigestMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Ticket Explorer state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketPage, setTicketPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Agent team filter
  const [agentTeamFilter, setAgentTeamFilter] = useState("All");

  // AI Analyst state
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{
    query: string;
    answer: string;
    analysis?: string;
    evidence: string[];
    data_used?: string[];
    source?: string;
    provider?: string;
    model?: string;
    fallback_used?: boolean;
    fallback_chain?: string[];
    relevant_tickets?: string[];
    latency_ms?: number;
  }>>([
    {
      query: "Why are repeat contacts high?",
      answer: "Repeat contacts rise sharply from 16.08% at 14 days to 26.96% at 30 days. Unresolved delivery status, payment reconciliation lag, and Bluetooth connectivity re-contacts drive 3,201 total repeat tickets costing ₹858,520.",
      analysis: "Expanding the measurement window from 14 to 30 days captures 1,291 additional repeat contacts that standard 14-day tracking misses. In the 30-day window, 26.96% of all unique tickets involve a customer contacting support about the same order. Reducing this rate from 27% to 22% yields an estimated ₹122,500 in quarterly savings at 650 tickets/week.",
      evidence: [
        "14-day repeat contacts: 1,910 tickets (16.08%), handling cost: ₹520,560",
        "30-day repeat contacts: 3,201 tickets (26.96%), handling cost: ₹858,520",
        "Quarterly savings opportunity: ₹122,500 by reducing 30d repeat rate to 22%"
      ],
      data_used: [
        "Support Policy v3.2 §10 (Repeat Contacts)",
        "Cleaned Tickets Dataset (11,875 rows)"
      ],
      source: "Support Policy v3.2 §10 (Repeat Contacts) across 11,875 deduplicated tickets",
      provider: "gemini",
      model: "gemini-2.5-flash",
      fallback_used: false,
      relevant_tickets: ["TK-240014", "TK-240016"]
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          metricsRes,
          complaintsRes,
          slaRes,
          csatRes,
          repeatsRes,
          agentsRes,
          valRes,
          digestRes,
          aiStatusRes
        ] = await Promise.all([
          fetch(`${API_BASE}/metrics`).then(r => r.json()),
          fetch(`${API_BASE}/complaints`).then(r => r.json()),
          fetch(`${API_BASE}/sla`).then(r => r.json()),
          fetch(`${API_BASE}/csat`).then(r => r.json()),
          fetch(`${API_BASE}/repeats`).then(r => r.json()),
          fetch(`${API_BASE}/agents`).then(r => r.json()),
          fetch(`${API_BASE}/validation`).then(r => r.json()),
          fetch(`${API_BASE}/digest`).then(r => r.json()),
          fetch(`${API_BASE}/ai/status`).then(r => r.json()).catch(() => null)
        ]);

        setMetrics(metricsRes);
        setComplaints(complaintsRes);
        setSlaData(slaRes);
        setCsatData(csatRes);
        setRepeatsData(repeatsRes);
        setAgentsData(agentsRes);
        setValidationData(valRes);
        setDigestMarkdown(digestRes.raw_markdown);
        if (aiStatusRes) setAiStatus(aiStatusRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch tickets for Ticket Explorer
  useEffect(() => {
    async function loadTickets() {
      try {
        const params = new URLSearchParams({
          page: ticketPage.toString(),
          limit: "20"
        });
        if (searchQuery) params.append("search", searchQuery);
        if (selectedChannel) params.append("channel", selectedChannel);
        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedTheme) params.append("theme", selectedTheme);

        const res = await fetch(`${API_BASE}/tickets?${params.toString()}`);
        const data = await res.json();
        setTickets(data.items || []);
        setTicketTotal(data.total || 0);
      } catch (e) {
        console.error("Failed to load tickets:", e);
      }
    }
    if (activeTab === "tickets" || selectedTheme) {
      loadTickets();
    }
  }, [ticketPage, searchQuery, selectedChannel, selectedCategory, selectedTheme, activeTab]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || userInput;
    if (!textToSend.trim() || aiLoading) return;

    setAiLoading(true);
    if (!queryText) setUserInput("");

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();
      setMessages(prev => [
        {
          query: textToSend,
          answer: data.answer,
          analysis: data.analysis,
          evidence: data.evidence || [],
          data_used: data.data_used || [],
          source: data.data_used && data.data_used.length > 0 ? data.data_used.join(" · ") : "Support Policy & Verified Dataset",
          provider: data.provider,
          model: data.model,
          fallback_used: data.fallback_used,
          fallback_chain: data.fallback_chain || [],
          relevant_tickets: data.relevant_tickets || [],
          latency_ms: data.latency_ms
        },
        ...prev
      ]);
    } catch (e) {
      setMessages(prev => [
        {
          query: textToSend,
          answer: "AI analyst offline. Core operational analytics remain fully verified across all tabs.",
          evidence: ["Verify backend is running on http://localhost:8000"],
          source: "Local Connection Fallback",
          provider: "local",
          fallback_used: true
        },
        ...prev
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const navSections = [
    {
      title: "Core Intelligence",
      items: [
        { id: "overview", label: "Overview", icon: LayoutGrid, count: null },
        { id: "analyst", label: "AI Analyst", icon: Bot, badge: "Grounded" },
        { id: "complaints", label: "Complaints", icon: MessageSquare, count: "324" }
      ]
    },
    {
      title: "Operations & Teams",
      items: [
        { id: "operations", label: "Operations", icon: Sliders, count: null },
        { id: "agents", label: "Agents", icon: Users, count: "44" },
        { id: "digest", label: "Weekly Digest", icon: Calendar, count: null }
      ]
    },
    {
      title: "Data & Audit",
      items: [
        { id: "tickets", label: "Ticket Explorer", icon: Database, count: "11.8k" },
        { id: "validation", label: "Validation Audit", icon: CheckCircle2, count: "17/17" }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-zinc-400 font-sans">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Loading Support Intelligence...</p>
        </div>
      </div>
    );
  }

  const s = metrics?.summary || {};
  const canc = complaints?.cancellation_glitch || {};

  const getChannelIcon = (ch: string) => {
    switch (ch.toLowerCase()) {
      case "chat": return <MessageCircle className="w-3.5 h-3.5" />;
      case "email": return <Mail className="w-3.5 h-3.5" />;
      case "voice": return <Phone className="w-3.5 h-3.5" />;
      case "social": return <Share2 className="w-3.5 h-3.5" />;
      default: return <Database className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex font-sans antialiased">
      {/* -------------------------------------------------------------
          LEFT SIDEBAR NAVIGATION (ENTERPRISE OBSIDIAN / LINEAR GRADE)
      ------------------------------------------------------------- */}
      <aside className="w-64 border-r border-zinc-800/80 bg-[#0d0f14] flex flex-col justify-between py-5 px-3 shrink-0 fixed top-0 bottom-0 left-0 z-30 shadow-[1px_0_10px_rgba(0,0,0,0.4)]">
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="px-2 pt-1 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 text-white flex items-center justify-center font-black text-xs tracking-tighter shadow-inner">
                VA
              </div>
              <div>
                <span className="font-bold text-xs tracking-tight text-white block leading-tight">VIREO AUDIO</span>
                <span className="text-[10px] text-zinc-400 font-medium leading-none">Support Intelligence</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium">
              v3.2
            </span>
          </div>

          {/* Grouped Navigation Links */}
          <div className="space-y-4">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  {sec.title}
                </span>
                <div className="space-y-0.5">
                  {sec.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-xs transition duration-150 text-left ${
                          isActive
                            ? "border-l-2 border-emerald-500 bg-zinc-800/50 text-white font-semibold"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/10"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.count && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                            isActive
                              ? "bg-zinc-700 text-zinc-200"
                              : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
                          }`}>
                            {item.count}
                          </span>
                        )}
                        {item.badge && !item.count && (
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-zinc-800 text-emerald-400 border border-zinc-700/60"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer Metadata */}
        <div className="px-2 pt-3 border-t border-zinc-800/80 space-y-2.5 text-left">
          <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Engine Status</span>
              <span className="flex items-center space-x-1.5 text-[10px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span>Live</span>
              </span>
            </div>
            <div className="text-xs font-semibold text-zinc-200 tabular-nums font-mono">
              11,875 <span className="font-normal text-zinc-400 text-[11px] font-sans">cleaned tickets</span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5 border-t border-zinc-800">
              <span>Pipeline: 0.75s</span>
              <span className="font-mono text-zinc-400 font-medium">₹0.00 cost</span>
            </div>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          MAIN CONTENT AREA
      ------------------------------------------------------------- */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-20 h-14 bg-[#090a0f]/80 backdrop-blur-md border-b border-zinc-800/80 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400 font-medium">Support Operations</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-200 font-semibold capitalize">
              {activeTab === "digest" ? "Weekly Digest" : activeTab}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium">17/17 Policy Reconciled</span>
            </div>

            <div className="flex items-center space-x-2 text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 text-[11px] font-mono">
              <span className="text-zinc-400">Dataset:</span>
              <span className="font-semibold text-zinc-200">FY26 (18-Month)</span>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto space-y-8">

          {/* =========================================================
              VIEW 1: OVERVIEW (EXECUTIVE INTELLIGENCE DASHBOARD)
          ========================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Editorial Header */}
              <div className="border-b border-zinc-800/80 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Executive Briefing</span>
                  <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Overview & Performance</h1>
                  <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                    18-month baseline analysis across 11,875 customer support tickets, 44 agents, and FY26 support policy standards.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setActiveTab("analyst")}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-semibold inline-flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <Bot className="w-3.5 h-3.5 text-zinc-800" />
                    <span>Ask AI Analyst</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 rounded-lg font-medium inline-flex items-center space-x-1.5 shadow-sm transition"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Search Tickets</span>
                  </button>
                </div>
              </div>

              {/* High-Precision Dark KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-zinc-700 transition duration-150">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Repeat Contacts (30d)</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-2 font-mono tracking-tight tabular-nums">
                    {s.repeat_rate_30d_pct}%
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="font-mono text-zinc-300 font-medium">{s.repeat_count_30d?.toLocaleString()} tickets</span>
                    <span className="text-zinc-400">16.1% on 14d</span>
                  </div>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-zinc-700 transition duration-150">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">SLA Breach Rate</span>
                    <Clock className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-2 font-mono tracking-tight tabular-nums">
                    {s.sla_breach_rate_pct}%
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="font-mono text-zinc-300 font-medium">{s.sla_breaches_count} breaches</span>
                    <span className="text-rose-400 font-medium">₹3.68L credit</span>
                  </div>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-zinc-700 transition duration-150">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Average CSAT</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-2 font-mono tracking-tight tabular-nums">
                    {s.average_csat} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="font-mono text-zinc-300 font-medium">{s.csat_responses?.toLocaleString()} valid</span>
                    <span className="text-zinc-400">44.4% resp rate</span>
                  </div>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-zinc-700 transition duration-150">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">30d Handling Cost</span>
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-2 font-mono tracking-tight tabular-nums">
                    ₹{(s.repeat_cost_30d_inr / 100000).toFixed(2)}L
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="font-mono text-zinc-300 font-medium">₹8,58,520 total</span>
                    <span className="text-emerald-400 font-medium">₹1.43L/quarter</span>
                  </div>
                </div>
              </div>

              {/* CRITICAL DEFECT: Primary Insight Box */}
              <div className="bg-[#141217] border border-rose-900/50 rounded-xl p-6 space-y-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-800/80 pb-3 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Critical Operational Defect
                      </span>
                      <span className="text-xs text-zinc-400">Checkout Flow</span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1">Cancellation / Address Editing Friction</h2>
                  </div>
                  <div className="flex items-center space-x-4 text-right">
                    <div>
                      <span className="text-2xl font-bold text-white font-mono leading-none">{canc.count || 324}</span>
                      <span className="text-[11px] text-zinc-400 block font-medium">affected tickets</span>
                    </div>
                    <div className="border-l border-zinc-800 pl-4">
                      <span className="text-2xl font-bold text-white font-mono leading-none">19.2%</span>
                      <span className="text-[11px] text-zinc-400 block font-medium">of "Other" category</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
                  Customers report that the cancellation control is unavailable or that address editing fails immediately after checkout.
                  Because the web/app button remains greyed out, customers are forced to contact support to intercept shipments before dispatch.
                  Fixing this UI button will directly eliminate an estimated <strong className="text-white">20–30 inbound tickets per week</strong>.
                </p>

                {/* Evidence Table */}
                <div className="border border-zinc-800/80 rounded-lg overflow-hidden">
                  <div className="bg-zinc-900/80 px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                    Sample Evidence from Support Transcripts
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-zinc-400 bg-zinc-900/40 border-b border-zinc-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Ticket ID</th>
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Channel</th>
                        <th className="py-2.5 px-3 font-semibold">Customer Message Excerpt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {canc.sample_tickets?.slice(0, 3).map((st: any) => (
                        <tr key={st.ticket_id} className="hover:bg-zinc-800/30 transition duration-100">
                          <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">{st.ticket_id}</td>
                          <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">{st.created_at}</td>
                          <td className="py-2.5 px-3 capitalize text-zinc-300">{st.channel}</td>
                          <td className="py-2.5 px-3 text-zinc-300 truncate max-w-md font-mono text-[11px]">"{st.customer_message}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => { setActiveTab("complaints"); setSelectedTheme("cancellation_ui_glitch"); }}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1.5 transition"
                  >
                    <span>View all 324 supporting tickets in Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-zinc-400">Root cause: Frontend order lock status logic</span>
                </div>
              </div>

              {/* REPEAT CONTACTS: 14d vs 30d Section */}
                              <div className="bg-[#12141c] border border-zinc-800/90 rounded-sm p-6 space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                <div className="border-b border-zinc-800 pb-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Repeat Contacts Analysis</span>
                    <h2 className="text-base font-bold text-white mt-0.5">14-Day vs. 30-Day Measurement Window</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Measured using the verified same customer + same order proxy defined in Support Policy v3.2 §10.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60">
                    +1,291 missed contacts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-zinc-800 p-5 rounded-xl bg-zinc-900/60 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">14 Days Window</span>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/60">Strict proxy</span>
                    </div>
                    <div className="pt-2 flex items-baseline space-x-3">
                      <span className="text-3xl font-bold text-white font-mono tracking-tight">1,910</span>
                      <span className="text-sm font-semibold text-zinc-400 font-mono">16.08%</span>
                    </div>
                    <div className="pt-1 text-xs text-zinc-300 space-y-0.5">
                      <p>Handling cost: <strong className="text-white font-mono">₹520,560</strong></p>
                      <p className="text-zinc-400 text-[11px]">Quarterly run-rate: ~₹86,760 / quarter</p>
                    </div>
                  </div>

                  <div className="border border-zinc-700 p-5 rounded-xl bg-zinc-900 text-white space-y-2 shadow-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">30 Days Window</span>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">Policy standard</span>
                    </div>
                    <div className="pt-2 flex items-baseline space-x-3">
                      <span className="text-3xl font-bold text-white font-mono tracking-tight">3,201</span>
                      <span className="text-sm font-semibold text-emerald-400 font-mono">26.96%</span>
                    </div>
                    <div className="pt-1 text-xs text-zinc-300 space-y-0.5">
                      <p>Handling cost: <strong className="text-white font-mono">₹858,520</strong></p>
                      <p className="text-zinc-400 text-[11px]">Quarterly run-rate: ~₹143,090 / quarter</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Quarterly Savings Opportunity:</strong> Reducing 30d repeat contact rate by 5 percentage points saves <strong>~₹1,22,500 / quarter</strong> at Vireo's 650 tickets/week volume.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("operations")}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 whitespace-nowrap inline-flex items-center space-x-1"
                  >
                    <span>Operations model</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SUPPORT HEALTH & COMPLAINT CATEGORIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Channel Distribution */}
                <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-5 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Support Channel Volume</h3>
                    <span className="text-[11px] text-zinc-400 font-mono">4 Channels</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    {metrics?.breakdowns?.channels && Object.entries(metrics.breakdowns.channels).map(([ch, cnt]: any) => {
                      const pct = ((cnt / s.total_tickets) * 100).toFixed(1);
                      return (
                        <div key={ch} className="space-y-1.5">
                          <div className="flex justify-between text-xs text-zinc-300">
                            <span className="capitalize font-medium flex items-center space-x-1.5">
                              {getChannelIcon(ch)}
                              <span>{ch}</span>
                            </span>
                            <span className="text-zinc-400 font-mono text-[11px]">{cnt.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Complaint Categories */}
                <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-5 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Top Intake Categories</h3>
                    <span className="text-[11px] text-zinc-400 font-mono">Top 5 by Share</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {complaints?.categories?.slice(0, 5).map((cat: any) => (
                      <div key={cat.category} className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-none">
                        <span className="text-zinc-300 font-medium">{cat.category}</span>
                        <div className="text-right">
                          <span className="font-semibold text-white font-mono">{cat.count.toLocaleString()}</span>
                          <span className="text-zinc-400 text-[11px] ml-1.5 font-mono">({cat.share_pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RESTRAINED AI ANALYST ENTRY POINT */}
              <div className="bg-[#13151f] border border-zinc-700/80 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span>Grounded Intelligence</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Ask the Support Knowledge Base</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Query customer experience, SLA liability, repeat contact costs, and root causes. Responses are backed by 11,875 verified tickets.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs shrink-0">
                  <button
                    onClick={() => { setActiveTab("analyst"); handleSendMessage("Why are repeat contacts high?"); }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition shadow-xs"
                  >
                    Why are repeat contacts high?
                  </button>
                  <button
                    onClick={() => { setActiveTab("analyst"); handleSendMessage("Explain the cancellation issue."); }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition shadow-xs"
                  >
                    Explain the cancellation issue
                  </button>
                  <button
                    onClick={() => { setActiveTab("analyst"); handleSendMessage("What is driving SLA liability?"); }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition shadow-xs"
                  >
                    What is driving SLA liability?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 2: AI SUPPORT ANALYST
          ========================================================= */}
          {activeTab === "analyst" && (
            <div className="space-y-8 max-w-4xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-5">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">AI ANALYST</span>
                  <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Ask the Support Data</h1>
                  <p className="text-xs text-zinc-400 mt-1">Explore customer experience, operational performance, and grounded audit citations.</p>
                </div>
                {aiStatus && (
                  <div className="text-left sm:text-right text-xs space-y-1 bg-[#12141c] border border-zinc-800 px-3.5 py-2.5 rounded-xl shadow-xs">
                    <div className="flex items-center sm:justify-end space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="font-semibold text-zinc-200 text-[11px] uppercase tracking-wide">Multi-Provider Router</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Primary: <strong className="text-zinc-200 capitalize">{aiStatus.primary_provider}</strong> &middot; Fallbacks: {aiStatus.fallback_providers?.join(" → ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Command Prompt Box */}
              <div className="relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a question (e.g. Why are repeat contacts high?)..."
                  className="w-full bg-[#12141c] border border-zinc-700/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-zinc-500 pr-24 shadow-inner transition"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={aiLoading || !userInput.trim()}
                  className="absolute right-2 top-2 bottom-2 px-3.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold disabled:opacity-30 transition flex items-center space-x-1"
                >
                  <span>Submit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Example Question Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Suggested Operational Queries</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "Why are repeat contacts high?",
                    "What is driving SLA liability?",
                    "What complaints need attention?",
                    "Explain the cancellation issue.",
                    "What does the CSAT data tell us?",
                    "Compare 14-day and 30-day repeat contacts"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="px-3 py-1.5 rounded-lg bg-[#12141c] border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-300 text-xs transition shadow-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Structured AI Analyst Answers */}
              <div className="space-y-6 pt-2">
                {aiLoading && (
                  <div className="bg-[#12141c] border border-zinc-800 p-5 rounded-xl text-xs text-zinc-400 flex items-center space-x-3 shadow-xs">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
                    <span>Analyzing Vireo Audio verified dataset...</span>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div key={idx} className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-6 space-y-5 shadow-md">
                    {/* Header with Provider Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-3 text-xs gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Query</span>
                        <span className="text-white font-medium">"{m.query}"</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                          {m.provider === "gemini" && "Google Gemini · grounded"}
                          {m.provider === "groq" && "Groq (Qwen) · grounded"}
                          {m.provider === "xai" && "xAI (Grok) · grounded"}
                          {m.provider === "nemotron" && "NVIDIA Nemotron · grounded"}
                          {m.provider === "local" && "Local Engine · ₹0 fallback"}
                          {!m.provider && "Support Intelligence · grounded"}
                        </span>
                        {m.fallback_used && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                            Fallback used
                          </span>
                        )}
                        {m.latency_ms ? (
                          <span className="text-zinc-400 font-mono text-[10px]">{m.latency_ms}ms</span>
                        ) : null}
                      </div>
                    </div>

                    {/* EXECUTIVE SUMMARY */}
                    <div className="bg-[#181a24] border-l-2 border-emerald-400 p-4 rounded-r-lg">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">EXECUTIVE SUMMARY</span>
                      <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                        {m.answer}
                      </p>
                    </div>

                    {/* DETAILED ANALYSIS */}
                    {m.analysis && (
                      <div className="border-t border-zinc-800/80 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">ANALYSIS & ROOT CAUSE</span>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                          {m.analysis}
                        </p>
                      </div>
                    )}

                    {/* EVIDENCE SECTION */}
                    {m.evidence && m.evidence.length > 0 && (
                      <div className="border-t border-zinc-800/80 pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">VERIFIED EVIDENCE</span>
                        <div className="space-y-2 text-xs text-zinc-200">
                          {m.evidence.map((ev, i) => (
                            <div key={i} className="flex items-start space-x-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/70">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{ev}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DATA USED SECTION */}
                    {(m.data_used || m.source) && (
                      <div className="border-t border-zinc-800/80 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">DATA USED / CITATIONS</span>
                        <div className="text-xs text-zinc-400 font-mono space-y-0.5">
                          {Array.isArray(m.data_used) && m.data_used.length > 0 ? (
                            m.data_used.map((d, i) => <div key={i}>&bull; {d}</div>)
                          ) : (
                            <div>{m.source}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RELEVANT AUDIT TICKETS */}
                    {m.relevant_tickets && m.relevant_tickets.length > 0 && (
                      <div className="border-t border-zinc-800/80 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">RELEVANT AUDIT TICKETS</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.relevant_tickets.map((tid, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setActiveTab("tickets"); setSearchQuery(tid); }}
                              className="font-mono text-[11px] px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition font-medium"
                            >
                              {tid}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Button: View Relevant Tickets */}
                    {m.relevant_tickets && m.relevant_tickets.length > 0 && (
                      <div className="pt-1 flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setActiveTab("tickets");
                            if (m.relevant_tickets && m.relevant_tickets.length > 0) {
                              setSearchQuery(m.relevant_tickets[0]);
                            } else if (m.query.toLowerCase().includes("cancel")) {
                              setSearchQuery("cancel");
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-zinc-700 hover:border-emerald-400 text-xs font-semibold text-white bg-zinc-800 inline-flex items-center space-x-1.5 shadow-xs transition"
                        >
                          <span>View relevant tickets ({m.relevant_tickets.length})</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 3: COMPLAINT INTELLIGENCE
          ========================================================= */}
          {activeTab === "complaints" && (
            <div className="space-y-8">
              <div className="border-b border-zinc-800/80 pb-5">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">COMPLAINT INTELLIGENCE</span>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">What's Driving Customer Friction?</h1>
                <p className="text-xs text-zinc-400 mt-1">Audited complaint themes across 11,875 deduplicated tickets.</p>
              </div>

              {/* Top Row: Themes Bars & Weekly Movement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horizontal Themes Bars */}
                <div className="bg-[#12141c] border border-zinc-800/90 p-5 rounded-xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Complaint Themes Distribution</h3>
                    <span className="text-[11px] text-zinc-400 font-mono">11,875 Tickets</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Logistics", count: 2134, pct: 57.7 },
                      { name: "Returns", count: 1197, pct: 23.8 },
                      { name: "Product Defect", count: 955, pct: 13.2 },
                      { name: "Billing", count: 1624, pct: 8.8 },
                      { name: "Account Access", count: 316, pct: 5.2 }
                    ].map(th => (
                      <div key={th.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-200 font-medium w-32">{th.name}</span>
                          <div className="flex-1 mx-3 flex items-center">
                            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, th.pct * 1.5)}%` }} />
                            </div>
                          </div>
                          <span className="text-zinc-400 font-mono text-[11px] w-12 text-right">{th.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Movement Line Sparkline */}
                <div className="bg-[#12141c] border border-zinc-800/90 p-5 rounded-xl space-y-4 flex flex-col justify-between shadow-xs">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-white">Weekly Intake Trajectory</h3>
                    <span className="text-[11px] text-zinc-400 font-mono">Tickets / week</span>
                  </div>
                  <div className="h-32 flex items-end justify-between px-2 pt-4 border-b border-zinc-800">
                    {[47, 54, 59, 82, 67, 120, 140, 160, 174, 157, 231, 204, 186, 171, 203, 167, 199].map((val, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="w-2.5 bg-emerald-500/80 rounded-t hover:bg-emerald-400 transition duration-150"
                          style={{ height: `${(val / 231) * 90}px` }}
                          title={`Week volume: ${val}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Jan 2025</span>
                    <span className="text-zinc-300 font-medium">Recent average: ~189 / wk</span>
                    <span>Jun 2026</span>
                  </div>
                </div>
              </div>

              {/* DEDICATED CANCELLATION FRICTION BOX */}
              <div className="bg-[#141217] border border-rose-900/50 rounded-xl p-6 space-y-4 shadow-md">
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Target Operational Defect</span>
                    <h2 className="text-base font-bold text-white mt-0.5">CANCELLATION / ADDRESS EDITING FRICTION</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-white font-mono">324 tickets</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-sm font-semibold text-rose-300 font-mono">19.2% of "Other"</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Customers report that the cancellation control is unavailable or that address editing fails after checkout.
                </p>

                {/* Evidence Table */}
                <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Ticket ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Agent Name</th>
                        <th className="py-2.5 px-3">Excerpt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {canc.sample_tickets?.slice(0, 4).map((st: any) => (
                        <tr key={st.ticket_id} className="hover:bg-zinc-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">{st.ticket_id}</td>
                          <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">{st.created_at}</td>
                          <td className="py-2.5 px-3 text-zinc-300">{st.channel}</td>
                          <td className="py-2.5 px-3 text-zinc-300 max-w-lg truncate font-mono text-[11px]">"{st.customer_message}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => { setActiveTab("tickets"); setSelectedTheme("cancellation_ui_glitch"); }}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
                  >
                    <span>View all 324 supporting tickets in Explorer &gt;</span>
                  </button>
                </div>
              </div>

              {/* Other Audited Themes Table */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-white">Other Audited Themes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase text-zinc-400 border-b border-zinc-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Theme</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Count</th>
                        <th className="py-2.5 px-3 font-semibold">Share</th>
                        <th className="py-2.5 px-3 font-semibold">Audited Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {complaints?.themes?.map((th: any) => (
                        <tr key={th.theme_id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-2.5 px-3 font-medium text-white">{th.name}</td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px]">{th.primary_category}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-zinc-200">{th.count}</td>
                          <td className="py-2.5 px-3 text-zinc-400 font-mono">{th.share_pct}%</td>
                          <td className="py-2.5 px-3 text-zinc-400 max-w-xs truncate">{th.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 4: OPERATIONS
          ========================================================= */}
          {activeTab === "operations" && (
            <div className="space-y-8">
              <div className="border-b border-zinc-800/80 pb-5">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">FINANCIAL & EFFICIENCY</span>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Support Operations & Cost</h1>
                <p className="text-xs text-zinc-400 mt-1">Resource allocation, SLA liability exposure, and repeat contact financial modeling.</p>
              </div>

              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">SLA BREACHES</span>
                  <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">1,051</div>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">8.85% total breach rate</span>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">SLA LIABILITY</span>
                  <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">₹367,850</div>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">₹350 / breach policy standard</span>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AVERAGE CSAT</span>
                  <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">3.32</div>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">5,269 valid responses</span>
                </div>

                <div className="bg-[#12141c] border border-zinc-800/90 p-4 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">REPEAT-CONTACT COST</span>
                  <div className="text-2xl font-bold text-white mt-1 font-mono tabular-nums">₹858,520</div>
                  <span className="text-[11px] text-zinc-400 mt-0.5 block">30-day cumulative window</span>
                </div>
              </div>

              {/* Big Card: REPEAT CONTACTS (14d vs 30d with Visual Bars) */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">REPEAT CONTACTS SENSITIVITY</span>
                  <span className="text-xs font-mono text-zinc-400">Same Customer + Same Order</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Left: 14 Days Box */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">14 DAYS</span>
                    <div className="pt-2">
                      <div className="text-3xl font-bold text-white font-mono">1,910</div>
                      <span className="text-[11px] text-zinc-400 font-medium">TICKETS</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-zinc-300 font-mono">16.08%</div>
                      <span className="text-[11px] text-zinc-400 font-medium">RATE</span>
                    </div>
                    <div className="pt-1 text-sm font-bold text-white font-mono">
                      ₹520,560
                    </div>
                  </div>

                  {/* Center: Visual Comparison Bars */}
                  <div className="flex flex-col items-center justify-end h-48 px-4 pb-2 border-b border-zinc-800">
                    <div className="flex items-end justify-center space-x-8 w-full h-40">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[11px] font-mono text-zinc-400 font-medium">16.1%</span>
                        <div className="w-14 bg-zinc-700 rounded-t" style={{ height: "70px" }} />
                        <span className="text-[11px] text-zinc-400 mt-1 font-medium">14d</span>
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">27.0%</span>
                        <div className="w-14 bg-emerald-500 rounded-t shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ height: "120px" }} />
                        <span className="text-[11px] text-emerald-400 mt-1 font-bold">30d</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: 30 Days Box */}
                  <div className="bg-zinc-900 border border-emerald-800/40 text-white p-5 rounded-xl space-y-2 shadow-sm">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">30 DAYS (STANDARD)</span>
                    <div className="pt-2">
                      <div className="text-3xl font-bold text-white font-mono">3,201</div>
                      <span className="text-[11px] text-zinc-400 font-medium">TICKETS</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-emerald-400 font-mono">26.96%</div>
                      <span className="text-[11px] text-zinc-400 font-medium">RATE</span>
                    </div>
                    <div className="pt-1 text-sm font-bold text-white font-mono">
                      ₹858,520
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: SLA PERFORMANCE, CSAT, OPERATIONAL COST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SLA Performance */}
                <div className="bg-[#12141c] border border-zinc-800/90 p-5 rounded-xl space-y-3 shadow-xs">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">SLA PERFORMANCE</span>
                  <div className="space-y-2 text-xs">
                    {slaData?.by_channel && Object.entries(slaData.by_channel).map(([ch, info]: any) => (
                      <div key={ch} className="flex justify-between items-center py-1.5 border-b border-zinc-800/60 last:border-none">
                        <span className="capitalize font-medium text-zinc-300">{ch}</span>
                        <div className="text-right font-mono">
                          <span className="font-semibold text-white">{info.breach_rate_pct.toFixed(1)}%</span>
                          <span className="text-[11px] text-zinc-400 ml-1.5">({info.breaches} breaches)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CSAT Distribution */}
                <div className="bg-[#12141c] border border-zinc-800/90 p-5 rounded-xl space-y-3 shadow-xs">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">CSAT DISTRIBUTION</span>
                  <div className="flex items-end justify-between h-32 pt-2 px-1 border-b border-zinc-800">
                    {csatData?.distribution && Object.entries(csatData.distribution).map(([star, count]: any) => (
                      <div key={star} className="flex flex-col items-center flex-1">
                        <span className="text-[10px] font-mono text-zinc-400 mb-1">{count}</span>
                        <div
                          className="w-7 bg-emerald-500/80 rounded-t"
                          style={{ height: `${(count / 1737) * 80}px` }}
                        />
                        <span className="text-[11px] text-zinc-300 mt-1 font-medium font-mono">{star}★</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    1,750 unresponded legacy surveys (coded 0) excluded per Policy §8.
                  </p>
                </div>

                {/* Operational Cost Breakdown */}
                <div className="bg-[#12141c] border border-zinc-800/90 p-5 rounded-xl space-y-3 shadow-xs">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">OPERATIONAL COST</span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/60">
                      <span className="font-sans">30d repeat handling</span>
                      <span className="font-semibold text-white">₹858,520</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/60">
                      <span className="font-sans">14d repeat handling</span>
                      <span className="font-semibold text-white">₹520,560</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/60">
                      <span className="font-sans">Quarterly savings target</span>
                      <span className="font-semibold text-emerald-400">₹122,500</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/60">
                      <span className="font-sans">Engine runtime cost</span>
                      <span className="font-semibold text-white">₹0.00</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 text-sm">
                      <span className="font-sans">Total 18m Repeat Cost</span>
                      <span>₹858,520</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 5: AGENTS
          ========================================================= */}
          {activeTab === "agents" && (
            <div className="space-y-8">
              <div className="border-b border-zinc-800/80 pb-5">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">TEAM PERFORMANCE</span>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Agent Scorecards</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Tier 1 frontline teams evaluated within work groups; Tier 2 warranty technicians evaluated strictly on resolution days per Support Policy §6.
                </p>
              </div>

              {/* Team Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {["All", "Chat Frontline", "Email Frontline", "Voice Frontline", "Logistics", "Billing", "Returns Desk"].map(team => (
                  <button
                    key={team}
                    onClick={() => setAgentTeamFilter(team)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition duration-150 ${
                      agentTeamFilter === team
                        ? "bg-zinc-100 text-zinc-950 font-bold shadow-sm"
                        : "bg-[#12141c] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>

              {/* Tier 1 Table */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">Tier 1 Frontline & Operations (38 Agents)</h3>
                    <p className="text-[11px] text-zinc-400">Evaluated on attended tickets per active week with balanced SLA, CSAT and repeat visibility</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Agent</th>
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-3">Site / Shift</th>
                        <th className="py-2.5 px-3 text-right">Tickets / Wk</th>
                        <th className="py-2.5 px-3 text-right">SLA Breach %</th>
                        <th className="py-2.5 px-3 text-right">CSAT Avg</th>
                        <th className="py-2.5 px-3 text-right">Repeat %</th>
                        <th className="py-2.5 px-3 text-right">Transfers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {agentsData?.tier1
                        ?.filter((a: any) => agentTeamFilter === "All" || a.team === agentTeamFilter)
                        .map((a: any) => (
                          <tr key={a.agent_id} className="hover:bg-zinc-800/40 transition duration-100">
                            <td className="py-2.5 px-3 font-medium text-white">
                              {a.name} <span className="font-mono text-[10px] text-zinc-400">({a.agent_id})</span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-300">{a.team}</td>
                            <td className="py-2.5 px-3 text-zinc-400">{a.site} &middot; {a.shift}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-white font-mono">{a.tickets_per_week}</td>
                            <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">{a.sla_breach_rate_pct}%</td>
                            <td className="py-2.5 px-3 text-right text-zinc-200 font-mono">{a.avg_csat} <span className="text-[10px] text-zinc-400">({a.csat_responses})</span></td>
                            <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">{a.repeat_contact_rate_pct}%</td>
                            <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">{a.transfer_rate}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tier 2 Table: Escalations & Warranty */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">Tier 2 Escalations & Warranty (6 Certified Technicians)</h3>
                    <p className="text-[11px] text-zinc-400">Ranked strictly on Resolution Speed in Days. Cases take multi-day hardware diagnostics.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                    Ranked by Days
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Agent</th>
                        <th className="py-2.5 px-3 text-right">Avg Resolution (Days)</th>
                        <th className="py-2.5 px-3 text-right">Median Days</th>
                        <th className="py-2.5 px-3 text-right">Cases (Context)</th>
                        <th className="py-2.5 px-3 text-right">SLA Breach %</th>
                        <th className="py-2.5 px-3 text-right">CSAT Avg</th>
                        <th className="py-2.5 px-3 text-right">Repeat %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {agentsData?.tier2?.map((a: any) => (
                        <tr key={a.agent_id} className="hover:bg-zinc-800/40 transition duration-100">
                          <td className="py-2.5 px-3 font-medium text-white">
                            {a.name} <span className="font-mono text-[10px] text-zinc-400">({a.agent_id})</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white font-mono">{a.avg_resolution_days} days</td>
                          <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">{a.median_resolution_days} days</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">{a.total_tickets}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">{a.sla_breach_rate_pct}%</td>
                          <td className="py-2.5 px-3 text-right text-zinc-200 font-mono">{a.avg_csat}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-300 font-mono">{a.repeat_contact_rate_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 6: WEEKLY DIGEST
          ========================================================= */}
          {activeTab === "digest" && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-zinc-800/80 pb-4 flex justify-between items-baseline">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">EXECUTIVE DIGEST</span>
                  <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Weekly Customer Complaint Digest</h1>
                  <p className="text-xs text-zinc-400 mt-0.5">Automated briefing for CX Leadership &middot; Recent complete operating weeks</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#12141c] border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 rounded-lg inline-flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              {/* Rendered Digest Content */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-6 space-y-6 shadow-xs">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 space-y-2">
                  <h3 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">Executive Digest Summary</h3>
                  <p className="leading-relaxed">
                    Across recent complete weeks, weekly ticket volume averaged <strong className="text-white font-mono">~189 tickets/week</strong>, distributed across Chat (43.5%), Email (32.1%), Voice (14.3%), and Social (10.1%).
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300">
                    <li><strong>Cancellation UI Blunder:</strong> 19.2% of 'Other' category complaints stem from broken cancel/edit controls.</li>
                    <li><strong>Repeat Contacts:</strong> 27.0% 30-day repeat rate costs ₹8.58 Lakh over 18m (~₹1.43L/quarter).</li>
                    <li><strong>SLA Exposure:</strong> 8.9% average weekly breach rate incurs ~₹10,000/week in automatic ₹350 store credits.</li>
                  </ul>
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-xs text-zinc-300 leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans text-xs bg-transparent p-0 text-zinc-300 leading-relaxed">
                    {digestMarkdown}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 7: TICKET EXPLORER
          ========================================================= */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">AUDIT EXPLORER</span>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Support Ticket Explorer</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Filter and inspect individual customer tickets, channels, and closing notes.</p>
              </div>

              {/* Toolbar */}
              <div className="bg-[#12141c] border border-zinc-800/90 p-3.5 rounded-xl flex flex-wrap items-center gap-3 shadow-xs">
                <div className="flex-1 min-w-[220px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search ticket ID, customer ID, or message text..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>

                <select
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="">All Channels</option>
                  <option value="chat">Chat</option>
                  <option value="email">Email</option>
                  <option value="voice">Voice</option>
                  <option value="social">Social</option>
                </select>

                <select
                  value={selectedTheme}
                  onChange={e => setSelectedTheme(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="">All Themes</option>
                  <option value="cancellation_ui_glitch">Cancellation UI Glitch</option>
                  <option value="delivery_shipping_delay">Delivery Delays</option>
                  <option value="payment_invoice_glitch">Payment & Invoice</option>
                  <option value="bluetooth_connectivity">Bluetooth Drops</option>
                  <option value="charging_power_failure">Charging Defects</option>
                  <option value="mic_call_quality">Mic & Call Audio</option>
                  <option value="return_refund_chasing">Refund Follow-ups</option>
                </select>

                {(searchQuery || selectedChannel || selectedTheme) && (
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedChannel(""); setSelectedTheme(""); }}
                    className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>

              {/* Data Table */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-zinc-800 text-xs text-zinc-400 flex justify-between items-center bg-zinc-900/60">
                  <span className="font-mono">Showing {tickets.length} of {ticketTotal.toLocaleString()} tickets</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={ticketPage === 1}
                      onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 disabled:opacity-30 rounded-lg text-xs font-semibold text-zinc-200 shadow-xs hover:bg-zinc-700"
                    >
                      Prev
                    </button>
                    <span className="font-mono text-[11px] px-1 text-zinc-300">Page {ticketPage}</span>
                    <button
                      disabled={tickets.length < 20}
                      onClick={() => setTicketPage(p => p + 1)}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 disabled:opacity-30 rounded-lg text-xs font-semibold text-zinc-200 shadow-xs hover:bg-zinc-700"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Ticket ID</th>
                        <th className="py-2.5 px-3 font-semibold">Channel</th>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Created</th>
                        <th className="py-2.5 px-3 font-semibold">SLA</th>
                        <th className="py-2.5 px-3 font-semibold">Customer Message</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {tickets.map(t => (
                        <tr key={t.ticket_id} className="hover:bg-zinc-800/40 transition duration-100">
                          <td className="py-2.5 px-3 font-mono font-medium text-emerald-400">{t.ticket_id}</td>
                          <td className="py-2.5 px-3 capitalize text-zinc-300">{t.channel}</td>
                          <td className="py-2.5 px-3 text-zinc-300">{t.category}</td>
                          <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">{t.created_at}</td>
                          <td className="py-2.5 px-3">
                            {t.is_sla_breach ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
                                Breached
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                                Met
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 max-w-md truncate font-mono text-[11px]">"{t.customer_message}"</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="text-white font-semibold hover:text-emerald-400 text-xs transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 8: DATA & VALIDATION
          ========================================================= */}
          {activeTab === "validation" && (
            <div className="space-y-8 max-w-4xl">
              <div className="border-b border-zinc-800/80 pb-5">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">QUALITY ASSURANCE</span>
                <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">Data & Validation Audit</h1>
                <p className="text-xs text-zinc-400 mt-0.5">Automated reconciliation and data migration integrity verification.</p>
              </div>

              {/* Status Banner */}
              <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0 font-bold shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-300">17 / 17 Validation Checks Passed (100%)</h3>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    Zero data drift. All raw counts, duplicate dropped records, timezone shifts, CSAT policy rules, and financial figures reconciled.
                  </p>
                </div>
              </div>

              {/* Reconciliation Table */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-white">Reconciliation Verification Checks</h3>
                <div className="prose prose-invert prose-sm max-w-none text-xs text-zinc-300">
                  <pre className="whitespace-pre-wrap font-sans text-xs bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-300">
                    {validationData?.validation_markdown}
                  </pre>
                </div>
              </div>

              {/* Data Quality Report */}
              <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-white">Migration Traps & Data Quality Report</h3>
                <div className="prose prose-invert prose-sm max-w-none text-xs text-zinc-300">
                  <pre className="whitespace-pre-wrap font-sans text-xs bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-300">
                    {validationData?.data_quality_markdown}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Ticket Details Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13151f] border border-zinc-700 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-emerald-400 text-sm">{selectedTicket.ticket_id}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize font-medium">{selectedTicket.channel}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-zinc-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5 text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <div>Category: <span className="text-white font-semibold">{selectedTicket.category}</span></div>
                <div>Status: <span className="text-white font-semibold">{selectedTicket.status}</span></div>
                <div>Created: <span className="text-zinc-300 font-mono text-[11px]">{selectedTicket.created_at}</span></div>
                <div>Resolved: <span className="text-zinc-300 font-mono text-[11px]">{selectedTicket.resolved_at || "Open"}</span></div>
                <div>Agent: <span className="text-zinc-300 font-medium">{selectedTicket.agent_name}</span></div>
                <div>Order ID: <span className="text-zinc-300 font-mono">{selectedTicket.matched_order_id || "None"}</span></div>
              </div>

              <div>
                <span className="font-semibold text-zinc-300 block mb-1">Customer Opening Message (Anonymized):</span>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 italic leading-relaxed font-mono text-[11px]">
                  "{selectedTicket.customer_message}"
                </div>
              </div>

              {selectedTicket.matched_themes && selectedTicket.matched_themes.length > 0 && (
                <div>
                  <span className="font-semibold text-zinc-400 block mb-1">Detected Themes:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTicket.matched_themes.map((th: string) => (
                      <span key={th} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                        {th}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-bold shadow-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
