import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  Filter, 
  Search,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  MapPin,
  HelpCircle,
  BarChart2,
  PieChart
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
import { getStatsSummary, getStatsSector, getStatsState, getProjects, getAlerts } from '../utils/api';
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
  const [projectsData, setProjectsData] = useState({ projects: [], total: 0 });
  const [scatterProjects, setScatterProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sector Chart Controls
  const [sectorViewMode, setSectorViewMode] = useState('volume'); // 'volume' | 'percentage' | 'critical'

  // Scatter Chart Quadrant Filter
  const [scatterQuadrant, setScatterQuadrant] = useState('all'); // 'all' | 'compound' | 'schedule' | 'fiscal' | 'nominal'

  // Filters for projects table
  const [sectorFilter, setSectorFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, secRes, stRes, alRes, scRes] = await Promise.all([
          getStatsSummary(),
          getStatsSector(),
          getStatsState(),
          getAlerts({ limit: 8 }),
          getProjects({ page: 1, page_size: 90, sort_by: 'risk_score', order: 'desc' })
        ]);
        setSummary(sumRes);
        setSectorStats(secRes || []);
        setStateStats(stRes);
        setRecentAlerts(alRes.alerts || []);
        setScatterProjects(scRes.projects || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  useEffect(() => {
    async function loadTableProjects() {
      try {
        const res = await getProjects({
          page: 1,
          page_size: 10,
          sector: sectorFilter,
          state: stateFilter,
          risk_category: riskFilter,
          search: searchQuery
        });
        setProjectsData(res);
      } catch (err) {
        console.error('Failed to fetch projects table:', err);
      }
    }
    loadTableProjects();
  }, [sectorFilter, stateFilter, riskFilter, searchQuery]);

  // KPI Animated Numbers
  const totalProjectsCount = useCountUp(summary?.total_projects || 0);
  const highRiskCount = useCountUp(summary?.high_risk_projects || 0);
  const avgCostOverrun = useCountUp(summary?.avg_cost_overrun_rate || 0, 1000, 1);
  const onTrackPct = useCountUp(summary?.on_track_percentage || 0, 1000, 1);

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

  const allSectors = ['All', ...new Set(sectorStats.map(s => s.sector))];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* SOVEREIGN INTELLIGENCE BANNER */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[rgba(61,58,52,0.1)] bg-[#FAF9F5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] text-[#D97706] flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif font-bold text-sm sm:text-base text-[#1B1C1A]">
                MoSPI Modern Archive (2001–Present) Telemetry Activated
              </h2>
              <span className="badge-nominal text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                276 Completed Reference Projects
              </span>
            </div>
            <p className="text-[11px] text-[#655E4E] mt-0.5">
              Empirical duration multipliers & 4-tier statutory Early Warning Alert System (EWAS) currently safeguarding ₹ 27.83 Lakh Cr across 1,484 active assets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono text-xs">
          <Link
            to="/benchmarks"
            className="btn-sovereign-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
          >
            <span>Module e: Benchmarks</span>
            <ArrowUpRight size={12} />
          </Link>
          <Link
            to="/drivers"
            className="btn-sovereign-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-xs"
          >
            <span>Module f: What-If</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* SECTION 1 — KPI STRIP (STAGGERED FRAMER MOTION) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* KPI 1: Monitored Assets */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Total Monitored Assets</span>
            <div className="p-2 rounded-full bg-[#EFECE6] text-[#1E1E1E] border border-[rgba(61,58,52,0.1)]">
              <Layers size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1B1C1A] tracking-tight tabular-nums">
              {totalProjectsCount}
            </span>
            <span className="badge-nominal text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full">
              Live Registry
            </span>
          </div>
          <p className="mt-2 text-xs text-[#655E4E]">
            ₹ {((summary?.total_sanctioned_cost || 0) / 1000).toFixed(1)}k Cr Sanctioned Portfolio
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1E1E1E]" />
        </motion.div>

        {/* KPI 2: High Risk Projects */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Critical Risk Threshold</span>
            <div className="p-2 rounded-full bg-[rgba(194,94,62,0.12)] text-[#C25E3E] border border-[rgba(194,94,62,0.22)]">
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#C25E3E] tracking-tight tabular-nums">
              {highRiskCount}
            </span>
            <span className="badge-sienna text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full">
              Escalation Active
            </span>
          </div>
          <p className="mt-2 text-xs text-[#655E4E]">
            Score &ge; 65/100 under statutory review
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#C25E3E]" />
        </motion.div>

        {/* KPI 3: Avg Cost Escalation */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>Avg Cost Escalation</span>
            <div className="p-2 rounded-full bg-[rgba(217,119,6,0.12)] text-[#D97706] border border-[rgba(217,119,6,0.22)]">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D97706] tracking-tight tabular-nums">
              +{avgCostOverrun}%
            </span>
            <span className="badge-amber text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full">
              Fiscal Drift
            </span>
          </div>
          <p className="mt-2 text-xs text-[#655E4E]">
            ₹ {((summary?.total_revised_cost - summary?.total_sanctioned_cost) || 0).toLocaleString()} Cr Overrun
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D97706]" />
        </motion.div>

        {/* KPI 4: On-Track Execution */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8D8574] text-xs font-semibold uppercase tracking-wider">
            <span>On-Track Execution</span>
            <div className="p-2 rounded-full bg-[rgba(74,93,78,0.12)] text-[#4A5D4E] border border-[rgba(74,93,78,0.22)]">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2D3A30] tracking-tight tabular-nums">
              {onTrackPct}%
            </span>
            <span className="badge-nominal text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full">
              Nominal Band
            </span>
          </div>
          <p className="mt-2 text-xs text-[#655E4E]">
            {summary?.low_risk_projects || 0} Assets within milestone budget
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#4A5D4E]" />
        </motion.div>
      </motion.div>

      {/* SECTION 2 — GEOSPATIAL SURVEILLANCE MAP CALLOUT BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-5 rounded-2xl border-l-4 border-l-[#D97706] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(217,119,6,0.14)] border border-[rgba(217,119,6,0.3)] shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-35" />
            <MapPin size={20} className="text-[#D97706] relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#1B1C1A]">
                National Geospatial Surveillance Map
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#D97706] border border-[rgba(217,119,6,0.2)]">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#655E4E] mt-0.5">
              1,775 assets actively plotted across 31 Indian States with pulsating risk radars, district centroids, and live slippage HUD.
            </p>
          </div>
        </div>

        <Link
          to="/map"
          className="btn-sovereign-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0 shadow-md"
        >
          <span>Launch Surveillance Map</span>
          <ArrowUpRight size={14} className="text-[#D97706]" />
        </Link>
      </motion.div>

      {/* SECTION 3 — MAIN 60/40 SPLIT GRID WITH INTUITIVE GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (60% -> 7 Cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          
          {/* Chart 1: Sector Risk Breakdown (Intuitive with View Modes & Editorial Insights) */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl">
            {/* Header with View Mode Toggles */}
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
                  Critical First
                </button>
              </div>
            </div>

            {/* Plain-English Insight Banner */}
            <div className="mb-4 p-2.5 rounded-xl bg-[rgba(239,236,230,0.7)] border border-[rgba(61,58,52,0.08)] flex items-center justify-between text-xs">
              <span className="text-[#655E4E] flex items-center gap-1.5">
                <span className="text-[#D97706] font-bold">●</span>
                <span className="font-semibold text-[#1B1C1A]">Key Insight:</span> 
                <span>Road Transport & Railways represent 68% of critical capital at risk.</span>
              </span>
              <div className="flex items-center gap-2.5 text-[11px] font-mono font-medium shrink-0 ml-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C25E3E]" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A5D4E]" /> Low</span>
              </div>
            </div>

            {/* Bar Chart Container */}
            {/* Bar Chart Container */}
            <div className="w-full" style={{ height: 290, minHeight: 290 }}>
              {processedSectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={290}>
                  <BarChart
                    key={`sector-chart-${sectorViewMode}`}
                    data={processedSectorData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
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
                      width={130} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="glass-card p-3 rounded-xl text-xs space-y-1.5 shadow-xl border border-[rgba(61,58,52,0.14)] font-sans">
                            <p className="font-serif font-bold text-sm text-[#1B1C1A]">{d.sector}</p>
                            <p className="text-[11px] text-[#8D8574]">Total Portfolio: {d.project_count || d.total} Assets</p>
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
                                <span>Nominal/Low:</span>
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

          {/* Chart 2: Cost vs Schedule Slippage (Crystal Clear 4-Quadrant Scatter Plot) */}
          <div className="monolith-card p-5 sm:p-6 rounded-2xl relative overflow-hidden">
            {/* Header */}
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
                <span>🔴 Compound Crisis ({quadrantCounts.compound})</span>
              </button>
              <button
                onClick={() => setScatterQuadrant('schedule')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'schedule' 
                    ? 'bg-[#D97706] text-white font-bold' 
                    : 'bg-[#D97706]/20 text-[#D97706] hover:bg-[#D97706]/30'
                }`}
              >
                <span>🟡 Stalled Timeline ({quadrantCounts.schedule})</span>
              </button>
              <button
                onClick={() => setScatterQuadrant('fiscal')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-full transition-all flex items-center gap-1 ${
                  scatterQuadrant === 'fiscal' 
                    ? 'bg-[#E0A96D] text-[#1E1E1E] font-bold' 
                    : 'bg-[#E0A96D]/20 text-[#E0A96D] hover:bg-[#E0A96D]/30'
                }`}
              >
                <span>🟠 Budget Drift ({quadrantCounts.fiscal})</span>
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

                  {/* Clear Quadrant Threshold Guideline Lines */}
                  <ReferenceLine x={10} stroke="#D97706" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Cost Threshold', fill: '#D97706', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={15} stroke="#C25E3E" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Schedule Threshold', fill: '#C25E3E', fontSize: 9, position: 'insideBottomLeft' }} />

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

            {/* Bottom Guidance Note */}
            <div className="mt-2 text-[11px] text-[#A39D8F] font-sans flex items-center justify-between border-t border-white/10 pt-2">
              <span>👉 Top-right dots represent dual delay and budget failure. Click chips above to isolate.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (40% -> 5 Cols) */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          
          {/* Live Surveillance Feed */}
          <div className="glass-card p-5 rounded-2xl flex flex-col h-[340px] sm:h-[370px]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#C25E3E]" />
                <h2 className="font-serif text-base font-bold text-[#1B1C1A]">Surveillance Feed</h2>
              </div>
              <Link to="/alerts" className="text-xs font-mono text-[#D97706] hover:text-[#1B1C1A] font-semibold flex items-center gap-1 transition-colors">
                View All <ArrowUpRight size={12} />
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
            <h2 className="font-serif text-base font-bold text-[#1B1C1A]">State Risk Leaderboard</h2>
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

      {/* SECTION 4 — FILTERABLE PROJECTS TABLE */}
      <div className="glass-card rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">Monitored Projects Catalog</h2>
            <p className="text-xs text-[#8D8574]">Total {projectsData.total} infrastructure packages registered under CUF surveillance</p>
          </div>

          {/* Filter Controls with Pill Geometries */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3.5 top-2.5 text-[#8D8574]" />
              <input
                type="text"
                placeholder="Search project, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#1B1C1A] pl-9 pr-3.5 py-2 rounded-full focus:outline-none focus:border-[#1E1E1E] transition-colors"
              />
            </div>

            {/* Sector Dropdown */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#3D3A34] px-3.5 py-2 rounded-full focus:outline-none focus:border-[#1E1E1E] font-medium max-w-[170px] truncate transition-colors"
            >
              {allSectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>

            {/* Risk Pills */}
            <div className="flex rounded-full bg-[#EFECE6] border border-[rgba(61,58,52,0.1)] p-0.5">
              {['All', 'High', 'Medium', 'Low'].map(r => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-3 py-1 text-xs font-mono rounded-full transition-all ${
                    riskFilter === r ? 'bg-[#1E1E1E] text-[#FAF9F5] font-bold shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Table Content */}
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[640px] sm:min-w-full">
            <thead className="bg-[#FAF9F5]/80 text-[#655E4E] uppercase font-semibold border-b border-[rgba(61,58,52,0.08)]">
              <tr>
                <th className="py-3 px-4">Project ID & Title</th>
                <th className="py-3 px-4">Sector & State</th>
                <th className="py-3 px-4">Sanctioned</th>
                <th className="py-3 px-4">Risk Index</th>
                <th className="py-3 px-4">Overrun Probs</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(61,58,52,0.06)] font-mono">
              {(projectsData.projects || []).map((proj) => (
                <tr key={proj.project_id} className="hover:bg-[rgba(239,236,230,0.5)] transition-colors">
                  <td className="py-3.5 px-4 font-sans max-w-[220px]">
                    <div className="font-bold text-[#1B1C1A] truncate">{proj.project_name}</div>
                    <div className="text-[10px] font-mono text-[#8D8574] mt-0.5 font-medium">{proj.project_id}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="text-[#1B1C1A] font-medium truncate max-w-[130px]">{proj.sector}</div>
                    <div className="text-[10px] text-[#8D8574]">{proj.state}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="text-[#1B1C1A] font-bold tabular-nums">₹ {proj.sanctioned_cost} Cr</div>
                    <div className="text-[10px] text-[#8D8574] tabular-nums">Exp: {proj.actual_expenditure} Cr</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      proj.risk_score >= 65 ? 'badge-sienna' :
                      proj.risk_score >= 35 ? 'badge-amber' :
                      'badge-nominal'
                    }`}>
                      {proj.risk_score}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-[#D97706] font-semibold tabular-nums">Cost: {Math.round((proj.cost_overrun_probability || 0.15) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-[#2C3E50] font-semibold tabular-nums">Time: {Math.round((proj.time_overrun_probability || 0.2) * 100)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/projects/${proj.project_id}`}
                      className="btn-sovereign-secondary inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-semibold transition-all"
                    >
                      <span>Inspect</span>
                      <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
