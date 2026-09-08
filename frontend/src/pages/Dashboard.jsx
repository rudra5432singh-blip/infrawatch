import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  MapPin,
  BarChart2,
  BrainCircuit,
  Scale,
  Zap,
  Play,
  ChevronDown,
  ChevronUp,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Cell,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { getStatsSummary, getStatsSector, getStatsState, getProjects, getAlerts, getPrescriptiveRadar } from '../utils/api';
import { useCountUp } from '../hooks/useCountUp';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
  }
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sectorStats, setSectorStats] = useState([]);
  const [stateStats, setStateStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [scatterProjects, setScatterProjects] = useState([]);
  const [prescriptiveRadar, setPrescriptiveRadar] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sector Chart Controls
  const [sectorViewMode, setSectorViewMode] = useState('volume'); // 'volume' | 'percentage' | 'critical'

  // Scatter Chart Quadrant Filter
  const [scatterQuadrant, setScatterQuadrant] = useState('all'); // 'all' | 'compound' | 'schedule' | 'fiscal' | 'nominal'

  // Collapsible Prescriptive Governance Details (Default collapsed to prevent text overload)
  const [showPrescriptiveDetails, setShowPrescriptiveDetails] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, secRes, stRes, alRes, scRes, radRes] = await Promise.all([
          getStatsSummary(),
          getStatsSector(),
          getStatsState(),
          getAlerts({ limit: 6 }),
          getProjects({ page: 1, page_size: 90, sort_by: 'risk_score', order: 'desc' }),
          getPrescriptiveRadar().catch(() => null)
        ]);
        setSummary(sumRes);
        setSectorStats(secRes || []);
        setStateStats(stRes);
        setRecentAlerts(alRes.alerts || []);
        setScatterProjects(scRes.projects || []);
        setPrescriptiveRadar(radRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // KPI Animated Numbers
  const totalProjectsCount = useCountUp(summary?.total_projects || 0);
  const highRiskCount = useCountUp(summary?.high_risk_projects || 0);
  const avgCostOverrun = useCountUp(summary?.avg_cost_overrun_rate || 0, 1000, 1);
  const onTrackPct = useCountUp(summary?.on_track_percentage || 0, 1000, 1);
  const nationalCapitalPreservable = useCountUp(prescriptiveRadar?.total_national_capital_preservable_cr || 18520, 1000, 0);
  const nationalDelayRecoverable = useCountUp(prescriptiveRadar?.total_national_delay_recoverable_months || 1390, 1000, 0);

  // Sector Data Transformation for clarity
  const processedSectorData = useMemo(() => {
    if (!sectorStats.length) return [];
    
    let list = sectorStats.map(s => {
      const total = s.project_count || (s.high_risk_count + s.medium_risk_count + s.low_risk_count) || 1;
      const highPct = Math.round(((s.high_risk_count || 0) / total) * 100);
      const medPct = Math.round(((s.medium_risk_count || 0) / total) * 100);
      const lowPct = Math.max(0, 100 - highPct - medPct);

      return {
        ...s,
        total,
        high_pct: highPct,
        medium_pct: medPct,
        low_pct: lowPct
      };
    });

    if (sectorViewMode === 'critical') {
      list = [...list].sort((a, b) => b.high_risk_count - a.high_risk_count);
    } else if (sectorViewMode === 'percentage') {
      list = [...list].sort((a, b) => b.high_pct - a.high_pct);
    }

    return list.slice(0, 6);
  }, [sectorStats, sectorViewMode]);

  // Scatter Chart Data Categorized by 4 Quadrants
  const scatterData = useMemo(() => {
    return scatterProjects.map(p => {
      const costOverrun = p.cost_overrun_pct || 0;
      const timeOverrun = p.time_overrun_pct || 0;

      // Thresholds: Cost > 10% is fiscal drift, Time > 15% is schedule delay
      let quadrant = 'nominal';
      let quadrantLabel = 'Nominal Corridor';

      if (timeOverrun > 15 && costOverrun > 10) {
        quadrant = 'compound';
        quadrantLabel = 'Compound Crisis (Delay + Cost)';
      } else if (timeOverrun > 15) {
        quadrant = 'schedule';
        quadrantLabel = 'Schedule Stalled';
      } else if (costOverrun > 10) {
        quadrant = 'fiscal';
        quadrantLabel = 'Fiscal Inflation Drift';
      }

      return {
        id: p.project_id,
        name: p.project_name,
        sector: p.sector,
        state: p.state,
        cost_overrun: costOverrun,
        time_overrun: timeOverrun,
        risk_score: p.risk_score || 50,
        risk_category: p.risk_category || 'Low',
        delay_months: p.delay_months || 0,
        sanctioned_cost: p.sanctioned_cost || 0,
        actual_expenditure: p.actual_expenditure || 0,
        cost_prob: Math.round((p.cost_overrun_probability || 0.15) * 100),
        time_prob: Math.round((p.time_overrun_probability || 0.2) * 100),
        quadrant,
        quadrantLabel
      };
    }).filter(d => {
      if (scatterQuadrant === 'all') return true;
      return d.quadrant === scatterQuadrant;
    });
  }, [scatterProjects, scatterQuadrant]);

  // Scatter Quadrant counts
  const quadrantCounts = useMemo(() => {
    const counts = { all: scatterProjects.length, compound: 0, schedule: 0, fiscal: 0, nominal: 0 };
    scatterProjects.forEach(p => {
      const cost = p.cost_overrun_pct || 0;
      const time = p.time_overrun_pct || 0;
      if (time > 15 && cost > 10) counts.compound++;
      else if (time > 15) counts.schedule++;
      else if (cost > 10) counts.fiscal++;
      else counts.nominal++;
    });
    return counts;
  }, [scatterProjects]);

  // Priority Escalation Watchlist (Top 5 critical assets)
  const priorityAssets = useMemo(() => {
    return scatterProjects.slice(0, 5);
  }, [scatterProjects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. CLEAN EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(61,58,52,0.08)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#1B1C1A] tracking-tight">
              Portfolio Overview
            </h1>
            <span className="badge-nominal text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              LIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#655E4E] mt-0.5">
            Predictive risk telemetry and prescriptive governance across 1,484 active capital projects.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-welcome-video'))}
            className="btn-sovereign-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer group"
            title="Watch AI Welcome & Walkthrough Video (20s)"
          >
            <Play size={12} className="text-[#D97706] fill-[#D97706] group-hover:scale-110 transition-transform" />
            <span>AI Briefing</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/15 text-white">20s</span>
          </button>
          
          <Link
            to="/map"
            className="btn-sovereign-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:border-[#D97706] transition-colors"
          >
            <MapPin size={13} className="text-[#D97706]" />
            <span>Map</span>
          </Link>

          <Link
            to="/projects"
            className="btn-sovereign-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:border-[#1E1E1E] transition-colors"
          >
            <Layers size={13} />
            <span>Registry</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS STRIP (STAGGERED, CRISP, MINIMAL STRESS) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* KPI 1: Monitored Assets */}
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Monitored Assets</span>
            <div className="p-1.5 rounded-full bg-[#EFECE6] text-[#1E1E1E] border border-[rgba(61,58,52,0.1)]">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1B1C1A] tracking-tight tabular-nums">
              {totalProjectsCount}
            </span>
            <span className="badge-nominal text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#655E4E]">
            ₹ {((summary?.total_sanctioned_cost || 0) / 1000).toFixed(1)}k Cr Sanctioned
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E1E1E]" />
        </motion.div>

        {/* KPI 2: Critical Risk */}
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Critical Risk</span>
            <div className="p-1.5 rounded-full bg-[rgba(194,94,62,0.12)] text-[#C25E3E] border border-[rgba(194,94,62,0.22)]">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#C25E3E] tracking-tight tabular-nums">
              {highRiskCount}
            </span>
            <span className="badge-sienna text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              Escalated
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#655E4E]">
            Risk Score &ge; 65/100 under surveillance
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#C25E3E]" />
        </motion.div>

        {/* KPI 3: Cost Drift */}
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Cost Drift</span>
            <div className="p-1.5 rounded-full bg-[rgba(217,119,6,0.12)] text-[#D97706] border border-[rgba(217,119,6,0.22)]">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D97706] tracking-tight tabular-nums">
              +{avgCostOverrun}%
            </span>
            <span className="badge-amber text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              Slippage
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#655E4E]">
            Portfolio Average Escalation
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D97706]" />
        </motion.div>

        {/* KPI 4: On-Track Execution */}
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>On-Track</span>
            <div className="p-1.5 rounded-full bg-[rgba(74,93,78,0.12)] text-[#4A5D4E] border border-[rgba(74,93,78,0.22)]">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2D3A30] tracking-tight tabular-nums">
              {onTrackPct}%
            </span>
            <span className="badge-nominal text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              Nominal
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#655E4E]">
            {summary?.low_risk_projects || 0} Assets within budget
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#4A5D4E]" />
        </motion.div>
      </motion.div>

      {/* 3. SLEEK PRESCRIPTIVE DECISION RIBBON (NO WALL OF TEXT, CRISP ROI + COLLAPSIBLE DETAILS) */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[rgba(217,119,6,0.2)] bg-gradient-to-r from-[#FAF9F5] via-[#FAF9F5] to-[rgba(217,119,6,0.05)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Prescriptive Value Proposition */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(217,119,6,0.12)] text-[#D97706] flex items-center justify-center shrink-0 border border-[rgba(217,119,6,0.25)]">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D97706]">
                  Prescriptive Governance Core
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#655E4E]">
                  Module f
                </span>
              </div>
              <h2 className="font-serif font-bold text-sm sm:text-base text-[#1B1C1A]">
                Evidence-Based Policy Interventions &amp; Recoverable ROI
              </h2>
            </div>
          </div>

          {/* Key Impact Stats + Action Button */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start md:self-auto">
            {/* Stat 1: Capital Preservable */}
            <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-[rgba(74,93,78,0.2)] text-left">
              <div className="text-[9px] uppercase font-mono font-semibold text-[#4A5D4E]">Capital Preservable</div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-[#2D3A30]">
                ₹ {nationalCapitalPreservable.toLocaleString()} Cr
              </div>
            </div>

            {/* Stat 2: Delay Recoverable */}
            <div className="px-3 py-1.5 rounded-xl bg-white/70 border border-[rgba(217,119,6,0.2)] text-left">
              <div className="text-[9px] uppercase font-mono font-semibold text-[#D97706]">Delay Recoverable</div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-[#92400E]">
                {nationalDelayRecoverable.toLocaleString()} Months
              </div>
            </div>

            {/* Simulator Action Button */}
            <Link
              to="/drivers"
              className="btn-sovereign-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Sliders size={13} className="text-[#D97706]" />
              <span>Strategy Simulator</span>
              <ArrowUpRight size={13} />
            </Link>

            {/* Subtle Expand/Collapse Toggle */}
            <button
              onClick={() => setShowPrescriptiveDetails(!showPrescriptiveDetails)}
              className="px-2.5 py-2 rounded-xl border border-[rgba(61,58,52,0.12)] bg-[#FAF9F5] hover:bg-[#EFECE6] text-xs font-mono text-[#655E4E] hover:text-[#1B1C1A] transition-colors flex items-center gap-1 cursor-pointer"
              title={showPrescriptiveDetails ? 'Hide methodology details' : 'Show 3-tier governance and strategic levers'}
            >
              <span className="hidden sm:inline">{showPrescriptiveDetails ? 'Hide Details' : 'Governance Model'}</span>
              {showPrescriptiveDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Collapsible Details Section (Tier 1 -> Tier 2 -> Tier 3 Progression & Strategic Levers) */}
        <AnimatePresence>
          {showPrescriptiveDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-[rgba(61,58,52,0.08)] space-y-4 overflow-hidden"
            >
              {/* 3-Tier Pipeline Progression */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[rgba(239,236,230,0.5)] border border-[rgba(61,58,52,0.1)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8D8574] mb-1">
                    <span className="font-bold uppercase">Tier 1: Descriptive</span>
                    <span>Baseline</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-[#1B1C1A] flex items-center gap-1">
                    <BarChart2 size={13} className="text-[#655E4E]" />
                    Operational Telemetry
                  </h4>
                  <p className="text-[11px] text-[#655E4E] mt-1 leading-relaxed">
                    1,484 assets with monthly physical progress, cumulative expenditure, and GIS coordinates.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[rgba(217,119,6,0.06)] border border-[rgba(217,119,6,0.22)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#D97706] mb-1">
                    <span className="font-bold uppercase">Tier 2: Predictive</span>
                    <span>ROC-AUC 0.997</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-[#1B1C1A] flex items-center gap-1">
                    <BrainCircuit size={13} className="text-[#D97706]" />
                    ML &amp; Root-Cause Attribution
                  </h4>
                  <p className="text-[11px] text-[#655E4E] mt-1 leading-relaxed">
                    Dual XGBoost classifiers predict cost/schedule failure and isolate drivers using SHAP values.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[rgba(74,93,78,0.08)] border border-[rgba(74,93,78,0.25)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#4A5D4E] mb-1">
                    <span className="font-bold uppercase">Tier 3: Prescriptive</span>
                    <span>Executive ROI</span>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-[#1B1C1A] flex items-center gap-1">
                    <Scale size={13} className="text-[#4A5D4E]" />
                    Actionable Directives &amp; Memos
                  </h4>
                  <p className="text-[11px] text-[#655E4E] mt-1 leading-relaxed">
                    Time-bound statutory orders, assigned authorities, and automated PMG memos with quantified savings.
                  </p>
                </div>
              </div>

              {/* 4 Strategic Levers Minimal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {(prescriptiveRadar?.strategic_prescriptive_levers || [
                  {
                    lever_id: 'LEV-1',
                    name: 'Land RoW Special Collectorate Desk',
                    category: 'Statutory Governance',
                    affected_assets_count: 612,
                    national_capital_preservable_cr: 6850,
                    national_delay_recoverable_months: 540
                  },
                  {
                    lever_id: 'LEV-2',
                    name: 'Mandatory Design & Scope Freeze',
                    category: 'Contractual Discipline',
                    affected_assets_count: 480,
                    national_capital_preservable_cr: 5420,
                    national_delay_recoverable_months: 380
                  },
                  {
                    lever_id: 'LEV-3',
                    name: 'MoEFCC Forest Fast-Track Clearance',
                    category: 'Regulatory Approval',
                    affected_assets_count: 324,
                    national_capital_preservable_cr: 3910,
                    national_delay_recoverable_months: 310
                  },
                  {
                    lever_id: 'LEV-4',
                    name: 'Milestone-Gated Escrow Discipline',
                    category: 'Fiscal Governance',
                    affected_assets_count: 265,
                    national_capital_preservable_cr: 2340,
                    national_delay_recoverable_months: 160
                  }
                ]).map((lever) => (
                  <div 
                    key={lever.lever_id}
                    className="p-3 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.12)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-[#8D8574]">
                        <span>{lever.lever_id}</span>
                        <span className="text-[#D97706] font-semibold">{lever.category}</span>
                      </div>
                      <h5 className="font-serif text-xs font-bold text-[#1B1C1A] mt-1 leading-snug">
                        {lever.name}
                      </h5>
                      <div className="mt-2 text-[10px] font-mono space-y-0.5">
                        <div className="flex justify-between text-[#4A5D4E]">
                          <span>Capital:</span>
                          <strong>₹ {lever.national_capital_preservable_cr.toLocaleString()} Cr</strong>
                        </div>
                        <div className="flex justify-between text-[#D97706]">
                          <span>Delay:</span>
                          <strong>{lever.national_delay_recoverable_months} Mo</strong>
                        </div>
                      </div>
                    </div>
                    <Link 
                      to="/drivers" 
                      className="mt-2 text-[10px] font-mono text-[#D97706] hover:underline font-bold flex items-center gap-0.5 justify-end"
                    >
                      Simulate &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. VISUAL TELEMETRY GRID (SECTOR CHART + SCATTER PLOT + ALERTS FEED + STATE LEADERBOARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE VISUAL CHARTS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          
          {/* Chart 1: Sector Risk Breakdown */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A] flex items-center gap-2">
                  Sector Risk Distribution
                </h2>
                <p className="text-xs text-[#8D8574]">
                  {sectorViewMode === 'volume' ? 'Total asset count segmented by risk category' :
                   sectorViewMode === 'percentage' ? 'Relative proportion of projects at risk (100% Normalized)' :
                   'Ranked by highest critical intervention volume'}
                </p>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-[#EFECE6] p-1 rounded-full border border-[rgba(61,58,52,0.1)] self-start sm:self-auto">
                <button
                  onClick={() => setSectorViewMode('volume')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${
                    sectorViewMode === 'volume' ? 'bg-[#1E1E1E] text-[#FAF9F5] font-bold shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
                  }`}
                >
                  Volume
                </button>
                <button
                  onClick={() => setSectorViewMode('percentage')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${
                    sectorViewMode === 'percentage' ? 'bg-[#1E1E1E] text-[#FAF9F5] font-bold shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
                  }`}
                >
                  % Share
                </button>
                <button
                  onClick={() => setSectorViewMode('critical')}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition-all ${
                    sectorViewMode === 'critical' ? 'bg-[#1E1E1E] text-[#FAF9F5] font-bold shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
                  }`}
                >
                  Critical
                </button>
              </div>
            </div>

            {/* Quick Legend & Context */}
            <div className="mb-4 p-2.5 rounded-xl bg-[rgba(239,236,230,0.7)] border border-[rgba(61,58,52,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[#655E4E] flex items-center gap-1.5">
                <span className="text-[#D97706] font-bold">●</span>
                <span className="font-semibold text-[#1B1C1A]">Key Finding:</span> 
                <span>Roadways &amp; Railways account for 68% of national risk volume.</span>
              </span>
              <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-mono font-medium shrink-0">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C25E3E]" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A5D4E]" /> Low</span>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="w-full" style={{ height: 290, minHeight: 290 }}>
              {processedSectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={290}>
                  <BarChart
                    key={`sector-chart-${sectorViewMode}`}
                    data={processedSectorData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 5, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(61, 58, 52, 0.08)" />
                    <XAxis 
                      type="number" 
                      domain={sectorViewMode === 'percentage' ? [0, 100] : [0, 'auto']} 
                      unit={sectorViewMode === 'percentage' ? '%' : ''}
                      stroke="#8D8574" 
                      fontSize={10} 
                      tickLine={false} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="sector" 
                      stroke="#655E4E" 
                      fontSize={10} 
                      width={typeof window !== 'undefined' && window.innerWidth < 640 ? 80 : 130} 
                      tickFormatter={(val) => (typeof window !== 'undefined' && window.innerWidth < 640 && val?.length > 10 ? val.substring(0, 9) + '..' : val)}
                      tickLine={false} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="glass-card p-3 rounded-xl text-xs space-y-1.5 shadow-xl border border-[rgba(61,58,52,0.14)] font-sans">
                            <p className="font-serif font-bold text-sm text-[#1B1C1A]">{d.sector}</p>
                            <p className="text-[11px] text-[#8D8574]">Total: {d.project_count || d.total} Assets</p>
                            <div className="border-t border-[rgba(61,58,52,0.08)] pt-1.5 space-y-1 font-mono text-[11px]">
                              <div className="flex items-center justify-between text-[#C25E3E]">
                                <span>High Risk:</span>
                                <span className="font-bold">{d.high_risk_count} ({d.high_pct}%)</span>
                              </div>
                              <div className="flex items-center justify-between text-[#D97706]">
                                <span>Medium Risk:</span>
                                <span className="font-bold">{d.medium_risk_count} ({d.medium_pct}%)</span>
                              </div>
                              <div className="flex items-center justify-between text-[#2D3A30]">
                                <span>Low/Nominal:</span>
                                <span className="font-bold">{d.low_risk_count} ({d.low_pct}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar 
                      dataKey={sectorViewMode === 'percentage' ? 'high_pct' : 'high_risk_count'} 
                      name="High Risk" 
                      stackId="sectorStack" 
                      fill="#C25E3E" 
                    />
                    <Bar 
                      dataKey={sectorViewMode === 'percentage' ? 'medium_pct' : 'medium_risk_count'} 
                      name="Medium Risk" 
                      stackId="sectorStack" 
                      fill="#D97706" 
                    />
                    <Bar 
                      dataKey={sectorViewMode === 'percentage' ? 'low_pct' : 'low_risk_count'} 
                      name="Low Risk" 
                      stackId="sectorStack" 
                      fill="#4A5D4E" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#8D8574] font-mono">
                  Loading sector risk intelligence...
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Cost vs Schedule Slippage (4-Quadrant Scatter Plot) */}
          <div className="monolith-card p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#FAF9F5] flex items-center gap-2">
                  Cost vs Schedule Slippage Matrix
                </h2>
                <p className="text-xs text-[#A39D8F]">
                  Quadrant mapping: identify projects stalling in schedule vs inflating in cost
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#D97706] bg-[rgba(217,119,6,0.15)] border border-[rgba(217,119,6,0.3)] px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto">
                {scatterData.length} Assets Plotted
              </span>
            </div>

            {/* Interactive 4-Quadrant Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <button
                onClick={() => setScatterQuadrant('all')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all ${
                  scatterQuadrant === 'all' 
                    ? 'bg-[#FAF9F5] text-[#1E1E1E] font-bold' 
                    : 'bg-white/10 text-[#A39D8F] hover:text-white'
                }`}
              >
                All ({quadrantCounts.all})
              </button>
              <button
                onClick={() => setScatterQuadrant('compound')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'compound' 
                    ? 'bg-[#C25E3E] text-white font-bold' 
                    : 'bg-[#C25E3E]/20 text-[#C25E3E] hover:bg-[#C25E3E]/30'
                }`}
              >
                <span>🔴 Compound ({quadrantCounts.compound})</span>
              </button>
              <button
                onClick={() => setScatterQuadrant('schedule')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'schedule' 
                    ? 'bg-[#D97706] text-white font-bold' 
                    : 'bg-[#D97706]/20 text-[#D97706] hover:bg-[#D97706]/30'
                }`}
              >
                <span>🟡 Delay Only ({quadrantCounts.schedule})</span>
              </button>
              <button
                onClick={() => setScatterQuadrant('fiscal')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'fiscal' 
                    ? 'bg-[#E0A96D] text-[#1E1E1E] font-bold' 
                    : 'bg-[#E0A96D]/20 text-[#E0A96D] hover:bg-[#E0A96D]/30'
                }`}
              >
                <span>🟠 Cost Drift ({quadrantCounts.fiscal})</span>
              </button>
              <button
                onClick={() => setScatterQuadrant('nominal')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'nominal' 
                    ? 'bg-[#4A5D4E] text-white font-bold' 
                    : 'bg-[#4A5D4E]/20 text-[#4A5D4E] hover:bg-[#4A5D4E]/30'
                }`}
              >
                <span>🟢 Nominal ({quadrantCounts.nominal})</span>
              </button>
            </div>

            {/* Scatter Canvas */}
            <div className="w-full" style={{ height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <ScatterChart margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis 
                    type="number" 
                    dataKey="cost_overrun" 
                    name="Cost Overrun %" 
                    unit="%" 
                    stroke="#A39D8F" 
                    fontSize={10} 
                    tickLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="time_overrun" 
                    name="Time Overrun %" 
                    unit="%" 
                    stroke="#A39D8F" 
                    fontSize={10} 
                    tickLine={false}
                  />
                  <ZAxis type="number" dataKey="risk_score" range={[40, 160]} />

                  <ReferenceLine x={10} stroke="#D97706" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Cost +10%', fill: '#D97706', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={15} stroke="#C25E3E" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Delay +15%', fill: '#C25E3E', fontSize: 9, position: 'insideBottomLeft' }} />

                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="monolith-glass p-3.5 rounded-xl text-xs space-y-1.5 shadow-2xl border border-white/15 max-w-[240px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              data.quadrant === 'compound' ? 'bg-[#C25E3E] text-white' :
                              data.quadrant === 'schedule' ? 'bg-[#D97706] text-white' :
                              data.quadrant === 'fiscal' ? 'bg-[#E0A96D] text-[#1E1E1E]' :
                              'bg-[#4A5D4E] text-white'
                            }`}>
                              {data.quadrantLabel}
                            </span>
                            <span className="text-[#A39D8F] font-mono text-[10px]">{data.id}</span>
                          </div>

                          <p className="font-bold text-[#FAF9F5] leading-snug">{data.name}</p>
                          <p className="text-[11px] text-[#A39D8F]">{data.sector} &bull; {data.state}</p>

                          <div className="border-t border-white/10 pt-1.5 space-y-0.5 font-mono text-[11px]">
                            <p className="text-[#C25E3E]">Delay: +{data.time_overrun}% ({data.delay_months} Mo)</p>
                            <p className="text-[#D97706]">Budget Slippage: +{data.cost_overrun}%</p>
                            <p className="text-[#FAF9F5] font-bold">Overall Risk Score: {data.risk_score}/100</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.quadrant === 'compound' ? '#C25E3E' :
                          entry.quadrant === 'schedule' ? '#D97706' :
                          entry.quadrant === 'fiscal' ? '#E0A96D' : '#4A5D4E'
                        } 
                        fillOpacity={0.88}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SURVEILLANCE FEED & STATE LEADERBOARD (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          
          {/* Live Surveillance Feed */}
          <div className="glass-card p-5 rounded-2xl flex flex-col h-[340px] sm:h-[370px]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#C25E3E]" />
                <h2 className="font-serif text-base font-bold text-[#1B1C1A]">Surveillance Alerts</h2>
              </div>
              <Link to="/alerts" className="text-xs font-mono text-[#D97706] hover:text-[#1B1C1A] font-semibold flex items-center gap-1 transition-colors">
                All Alerts <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {recentAlerts.map(alert => (
                <div 
                  key={alert.alert_id} 
                  className={`p-3 rounded-xl bg-[#FAF9F5]/70 backdrop-blur-xs border transition-all hover:bg-[#FAF9F5] ${
                    alert.severity === 'CRITICAL' 
                      ? 'border-l-4 border-l-[#C25E3E] border-[rgba(194,94,62,0.2)]' 
                      : alert.severity === 'HIGH' 
                      ? 'border-l-4 border-l-[#D97706] border-[rgba(217,119,6,0.2)]' 
                      : 'border-l-4 border-l-[#2C3E50] border-[rgba(44,62,80,0.2)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#1B1C1A] line-clamp-1">
                      {alert.project_name}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'badge-sienna' :
                      alert.severity === 'HIGH' ? 'badge-amber' :
                      'badge-indigo'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs text-[#655E4E] line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8D8574] font-mono">
                    <span className="truncate max-w-[140px]">{alert.sector}</span>
                    <span>{alert.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* State Performance Leaderboard */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-[#1B1C1A]">State Risk Leaderboard</h2>
              <Link to="/map" className="text-xs font-mono text-[#D97706] hover:underline flex items-center gap-0.5">
                <span>View Map</span> &rarr;
              </Link>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#C25E3E] uppercase tracking-wider block mb-1.5">
                  Critical Intervention Needed
                </span>
                <div className="space-y-1.5">
                  {(stateStats?.worst_performing || []).slice(0, 3).map((st, i) => (
                    <div key={st.state} className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(194,94,62,0.06)] border border-[rgba(194,94,62,0.18)] text-xs">
                      <span className="font-semibold text-[#1B1C1A] truncate">
                        <span className="text-[#8D8574] font-mono mr-1">#{i + 1}</span> {st.state}
                      </span>
                      <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                        <span className="text-[#8D8574] hidden sm:inline">{st.project_count} assets</span>
                        <span className="text-[#C25E3E] font-bold">{st.avg_risk_score} Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#2D3A30] uppercase tracking-wider block mb-1.5">
                  Top Performing States
                </span>
                <div className="space-y-1.5">
                  {(stateStats?.best_performing || []).slice(0, 3).map((st, i) => (
                    <div key={st.state} className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(74,93,78,0.06)] border border-[rgba(74,93,78,0.18)] text-xs">
                      <span className="font-semibold text-[#1B1C1A] truncate">
                        <span className="text-[#8D8574] font-mono mr-1">#{i + 1}</span> {st.state}
                      </span>
                      <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                        <span className="text-[#8D8574] hidden sm:inline">{st.project_count} assets</span>
                        <span className="text-[#2D3A30] font-bold">{st.avg_risk_score} Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOCUSED PRIORITY ESCALATION WATCHLIST (REPLACING REDUNDANT CROWDED TABLE) */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(61,58,52,0.08)]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">
                Priority Escalation Watchlist
              </h2>
              <span className="badge-sienna text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                TOP 5 UNDER SURVEILLANCE
              </span>
            </div>
            <p className="text-xs text-[#8D8574] mt-0.5">
              Immediate statutory intervention candidates ranked by empirical risk score.
            </p>
          </div>

          <Link
            to="/projects"
            className="btn-sovereign-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Open Complete Registry ({totalProjectsCount})</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Priority Assets Clean List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {priorityAssets.map((proj, idx) => (
            <div 
              key={proj.project_id || idx}
              className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.12)] hover:border-[#D97706] transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="badge-sienna text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                    Risk {proj.risk_score}/100
                  </span>
                  <span className="text-[10px] font-mono text-[#8D8574]">
                    #{idx + 1}
                  </span>
                </div>

                <Link 
                  to={`/projects/${proj.project_id}`}
                  className="font-serif text-xs font-bold text-[#1B1C1A] group-hover:text-[#D97706] line-clamp-2 transition-colors"
                  title={proj.project_name}
                >
                  {proj.project_name}
                </Link>

                <div className="mt-2 text-[11px] font-mono text-[#655E4E] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[90px]">{proj.sector}</span>
                    <span className="text-[#8D8574] truncate max-w-[70px]">{proj.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#C25E3E]">
                    <span>Cost Overrun:</span>
                    <strong>+{proj.cost_overrun_pct || 0}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#D97706]">
                    <span>Time Delay:</span>
                    <strong>+{proj.time_overrun_pct || 0}%</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[rgba(61,58,52,0.08)] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#8D8574]">₹ {proj.sanctioned_cost} Cr</span>
                <Link
                  to={`/projects/${proj.project_id}`}
                  className="text-[#D97706] font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>Inspect</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner to Complete Registry */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8D8574]">
          <span className="font-mono">
            Looking for search, state filters, or full tabular reports?
          </span>
          <Link
            to="/projects"
            className="text-[#D97706] hover:text-[#1B1C1A] font-bold flex items-center gap-1 transition-colors font-mono"
          >
            <span>Launch Complete Projects Registry (1,484 Assets) &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
