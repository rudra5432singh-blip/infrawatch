import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  Filter, 
  Search,
  ArrowUpRight,
  ShieldAlert
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
  CartesianGrid
} from 'recharts';
import { getStatsSummary, getStatsSector, getStatsState, getProjects, getAlerts } from '../utils/api';
import { useCountUp } from '../hooks/useCountUp';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sectorStats, setSectorStats] = useState([]);
  const [stateStats, setStateStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [projectsData, setProjectsData] = useState({ projects: [], total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters for projects table
  const [sectorFilter, setSectorFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumRes, secRes, stRes, alRes] = await Promise.all([
          getStatsSummary(),
          getStatsSector(),
          getStatsState(),
          getAlerts({ limit: 8 })
        ]);
        setSummary(sumRes);
        setSectorStats(secRes);
        setStateStats(stRes);
        setRecentAlerts(alRes.alerts || []);
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

  // Scatter chart data
  const scatterData = (projectsData.projects || []).map(p => ({
    name: p.project_name,
    cost_overrun: p.cost_overrun_pct,
    time_overrun: p.time_overrun_pct,
    risk_score: p.risk_score,
    risk_category: p.risk_category
  }));

  const allSectors = ['All', ...new Set(sectorStats.map(s => s.sector))];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* SECTION 1 — KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1 */}
        <div className="intel-card p-4 sm:p-5 rounded-xl relative overflow-hidden bg-white border-slate-200">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Total Monitored Assets</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A]">
              {totalProjectsCount.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              100% Synced
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#64748B]">
            Rs. {((summary?.total_sanctioned_cost || 0) / 1000).toFixed(1)}k Cr Sanctioned Portfolio
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>

        {/* KPI 2 */}
        <div className="intel-card p-4 sm:p-5 rounded-xl relative overflow-hidden bg-white border-slate-200">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>High Risk Projects</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600">
              {highRiskCount}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
              Alert Triggered
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#64748B]">
            Score &ge; 65/100 requiring escalation
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* KPI 3 */}
        <div className="intel-card p-4 sm:p-5 rounded-xl relative overflow-hidden bg-white border-slate-200">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Avg Cost Escalation</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600">
              +{avgCostOverrun}%
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              Cost Creep
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#64748B]">
            Rs. {((summary?.total_revised_cost - summary?.total_sanctioned_cost) || 0).toLocaleString()} Cr Overrun
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* KPI 4 */}
        <div className="intel-card p-4 sm:p-5 rounded-xl relative overflow-hidden bg-white border-slate-200">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>On-Track Execution</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">
              {onTrackPct}%
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Nominal Band
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#64748B]">
            {summary?.low_risk_projects || 0} Assets within milestone budget
          </p>
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* SECTION 2 — MAIN 60/40 SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (60% -> 7 Cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Chart 1: Sector Risk Breakdown */}
          <div className="intel-card p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Sector Risk Distribution</h2>
                <p className="text-xs text-[#64748B]">High, Medium, and Low risk volume across top sectors</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low</span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorStats.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" stroke="#64748B" fontSize={10} />
                  <YAxis type="category" dataKey="sector" stroke="#64748B" fontSize={10} width={100} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }}
                  />
                  <Bar dataKey="high_risk_count" name="High Risk" stackId="a" fill="#E11D48" />
                  <Bar dataKey="medium_risk_count" name="Medium Risk" stackId="a" fill="#D97706" />
                  <Bar dataKey="low_risk_count" name="Low Risk" stackId="a" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cost vs Time Overrun Scatter */}
          <div className="intel-card p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Cost vs Schedule Slippage</h2>
                <p className="text-xs text-[#64748B]">Compounded overrun correlation cluster</p>
              </div>
              <span className="text-[10px] sm:text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-medium self-start sm:self-auto">
                Live Clustering
              </span>
            </div>

            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    type="number" 
                    dataKey="cost_overrun" 
                    name="Cost Overrun %" 
                    unit="%" 
                    stroke="#64748B" 
                    fontSize={10} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="time_overrun" 
                    name="Time Overrun %" 
                    unit="%" 
                    stroke="#64748B" 
                    fontSize={10} 
                  />
                  <ZAxis type="number" dataKey="risk_score" range={[30, 140]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-xs space-y-1 shadow-lg">
                          <p className="font-bold text-slate-900 line-clamp-1">{data.name}</p>
                          <p className="text-amber-600 font-mono">Cost: +{data.cost_overrun}%</p>
                          <p className="text-indigo-600 font-mono">Delay: +{data.time_overrun}%</p>
                          <p className="text-rose-600 font-mono font-bold">Score: {data.risk_score}/100</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.risk_category === 'High' ? '#E11D48' : entry.risk_category === 'Medium' ? '#D97706' : '#059669'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (40% -> 5 Cols) */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          {/* Live Alert Feed */}
          <div className="intel-card p-4 sm:p-5 rounded-xl flex flex-col h-[320px] sm:h-[350px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600" />
                <h2 className="text-sm font-bold text-[#0F172A]">Surveillance Feed</h2>
              </div>
              <Link to="/alerts" className="text-xs font-mono text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {recentAlerts.map(alert => (
                <div 
                  key={alert.alert_id} 
                  className={`p-2.5 sm:p-3 rounded-lg bg-slate-50 border ${
                    alert.severity === 'CRITICAL' 
                      ? 'border-l-4 border-l-rose-500 border-rose-200' 
                      : alert.severity === 'HIGH' 
                      ? 'border-l-4 border-l-amber-500 border-amber-200' 
                      : 'border-l-4 border-l-indigo-500 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                      {alert.project_name}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      alert.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs text-[#475569] line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                    <span className="truncate max-w-[140px]">{alert.sector}</span>
                    <span>{alert.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* State Performance Leaderboard */}
          <div className="intel-card p-4 sm:p-5 rounded-xl">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">State Risk Leaderboard</h2>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1.5">
                  Critical Intervention Needed
                </span>
                <div className="space-y-1.5">
                  {(stateStats?.worst_performing || []).slice(0, 3).map((st, i) => (
                    <div key={st.state} className="flex items-center justify-between p-2 rounded bg-rose-50/50 border border-rose-100 text-xs">
                      <span className="font-semibold text-slate-900 truncate">
                        <span className="text-[#64748B] font-mono mr-1">#{i + 1}</span> {st.state}
                      </span>
                      <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                        <span className="text-[#64748B] hidden sm:inline">{st.project_count} assets</span>
                        <span className="text-rose-600 font-bold">{st.avg_risk_score} Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">
                  Top Performing States
                </span>
                <div className="space-y-1.5">
                  {(stateStats?.best_performing || []).slice(0, 3).map((st, i) => (
                    <div key={st.state} className="flex items-center justify-between p-2 rounded bg-emerald-50/50 border border-emerald-100 text-xs">
                      <span className="font-semibold text-slate-900 truncate">
                        <span className="text-[#64748B] font-mono mr-1">#{i + 1}</span> {st.state}
                      </span>
                      <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                        <span className="text-[#64748B] hidden sm:inline">{st.project_count} assets</span>
                        <span className="text-emerald-700 font-bold">{st.avg_risk_score} Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — FILTERABLE PROJECTS TABLE */}
      <div className="intel-card rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">Monitored Projects Catalog</h2>
            <p className="text-xs text-[#64748B]">Total {projectsData.total} infrastructure packages registered</p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-2.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search project, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-52 bg-white border border-[#CBD5E1] text-xs text-[#0F172A] pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Sector Dropdown */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-white border border-[#CBD5E1] text-xs text-[#334155] px-2.5 py-2 rounded-lg focus:outline-none focus:border-indigo-500 shadow-2xs font-medium max-w-[160px] truncate"
            >
              {allSectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>

            {/* Risk Pills */}
            <div className="flex rounded-lg bg-slate-100 border border-[#CBD5E1] p-0.5">
              {['All', 'High', 'Medium', 'Low'].map(r => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                    riskFilter === r ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-[#64748B]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Table Content */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-xs min-w-[620px] sm:min-w-full">
            <thead className="bg-slate-50 text-[#475569] uppercase font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 sm:px-4">Project ID & Title</th>
                <th className="py-2.5 px-3 sm:px-4">Sector & State</th>
                <th className="py-2.5 px-3 sm:px-4">Sanctioned</th>
                <th className="py-2.5 px-3 sm:px-4">Risk Index</th>
                <th className="py-2.5 px-3 sm:px-4">Overrun Probs</th>
                <th className="py-2.5 px-3 sm:px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(projectsData.projects || []).map((proj) => (
                <tr key={proj.project_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 sm:px-4 font-sans max-w-[200px]">
                    <div className="font-bold text-slate-900 truncate">{proj.project_name}</div>
                    <div className="text-[10px] font-mono text-indigo-600 mt-0.5 font-medium">{proj.project_id}</div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-sans">
                    <div className="text-slate-800 font-medium truncate max-w-[130px]">{proj.sector}</div>
                    <div className="text-[10px] text-[#64748B]">{proj.state}</div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <div className="text-slate-900 font-bold">Rs. {proj.sanctioned_cost} Cr</div>
                    <div className="text-[10px] text-[#64748B]">Exp: {proj.actual_expenditure} Cr</div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs" style={{
                      backgroundColor: proj.risk_score >= 65 ? '#FFE4E6' : proj.risk_score >= 35 ? '#FEF3C7' : '#D1FAE5',
                      color: proj.risk_score >= 65 ? '#BE123C' : proj.risk_score >= 35 ? '#B45309' : '#047857',
                      border: `1px solid ${proj.risk_score >= 65 ? '#FECDD3' : proj.risk_score >= 35 ? '#FDE68A' : '#A7F3D0'}`
                    }}>
                      {proj.risk_score}
                    </div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-amber-600 font-semibold">Cost: {Math.round((proj.cost_overrun_probability || 0.15) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-indigo-600 font-semibold">Time: {Math.round((proj.time_overrun_probability || 0.2) * 100)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/projects/${proj.project_id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors text-xs font-sans font-semibold"
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
