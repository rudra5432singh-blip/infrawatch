import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Search, 
  RotateCcw,
  Zap,
  Building2,
  FileCheck
} from 'lucide-react';
import { getCostDrivers, getProjects, simulateProjectIntervention, getProjectForecast } from '../utils/api';

export default function CostDrivers() {
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForecast, setProjectForecast] = useState(null);

  // Intervention Toggles
  const [landComplete, setLandComplete] = useState(false);
  const [envObtained, setEnvObtained] = useState(false);
  const [forestObtained, setForestObtained] = useState(false);
  const [freezeRevisions, setFreezeRevisions] = useState(false);
  const [resolveDisputes, setResolveDisputes] = useState(false);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [drivers, projs] = await Promise.all([
          getCostDrivers().catch(() => null),
          getProjects({ page_size: 50, sort_by: 'risk_score', order: 'desc' }).catch(() => ({ projects: [] }))
        ]);
        setDriverData(drivers);
        const list = projs.projects || [];
        setProjectsList(list);

        if (list.length > 0) {
          const first = list[0];
          setSelectedProjectId(first.project_id);
          setSelectedProject(first);
          loadForecast(first.project_id);
        }
      } catch (err) {
        console.error('Failed to load cost drivers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const loadForecast = async (projId) => {
    try {
      const fc = await getProjectForecast(projId);
      setProjectForecast(fc);
      setSimResult(null); // Reset previous simulation
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    }
  };

  const handleSelectProject = (e) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    const found = projectsList.find(p => p.project_id === pId);
    setSelectedProject(found || null);
    loadForecast(pId);
  };

  const handleRunSimulation = async () => {
    if (!selectedProjectId) return;
    setSimulating(true);

    const adjustments = {};
    if (landComplete) adjustments.land_acquisition_status = 'Complete';
    if (envObtained) adjustments.environment_clearance = 'Obtained';
    if (forestObtained) adjustments.forest_clearance = 'Obtained';
    if (freezeRevisions) adjustments.revision_count = 0;
    if (resolveDisputes) adjustments.disputes_count = 0;

    try {
      const res = await simulateProjectIntervention(selectedProjectId, adjustments);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetToggles = () => {
    setLandComplete(false);
    setEnvObtained(false);
    setForestObtained(false);
    setFreezeRevisions(false);
    setResolveDisputes(false);
    setSimResult(null);
  };

  const globalDrivers = driverData?.global_drivers || [
    { id: 'scope', name: 'Scope & Design Modifications', impact_share_pct: 31.4, affected_projects_count: 480, avg_cost_impact_cr: 142.5, severity: 'Critical', description: 'Frequent architectural scope changes, engineering alterations, and specification revisions.' },
    { id: 'land', name: 'Land Acquisition Bottlenecks', impact_share_pct: 26.8, affected_projects_count: 612, avg_cost_impact_cr: 118.2, severity: 'Critical', description: 'Right-of-Way (RoW) litigation, title compensation disputes, and delayed state handover.' },
    { id: 'clearances', name: 'Forest & Environmental Clearances', impact_share_pct: 18.2, affected_projects_count: 324, avg_cost_impact_cr: 84.6, severity: 'High', description: 'Pending regulatory approvals from MoEFCC, state wildlife boards, and environmental clearances.' },
    { id: 'utility', name: 'Utility Shifting & RoW Stalls', impact_share_pct: 11.6, affected_projects_count: 245, avg_cost_impact_cr: 52.1, severity: 'Medium', description: 'Relocation of high-voltage transmission lines, water pipelines, and railway optical cables.' },
    { id: 'disputes', name: 'Contractor Disputes & Cashflow Stalls', impact_share_pct: 7.8, affected_projects_count: 178, avg_cost_impact_cr: 38.4, severity: 'Medium', description: 'Contractual arbitration, liquidity constraints of execution agencies, and labor shortages.' },
    { id: 'materials', name: 'Raw Material & Commodity Inflation', impact_share_pct: 4.2, affected_projects_count: 530, avg_cost_impact_cr: 18.5, severity: 'Low', description: 'Unanticipated price escalation in cement, structural steel, bitumen, and fuel.' }
  ];

  const sectorMatrix = driverData?.sector_driver_matrix || [
    { sector: 'Roads & Highways', primary_driver: 'Land Acquisition Bottlenecks', primary_impact_pct: 38.5, secondary_driver: 'Utility Shifting', risk_exposure: 'High' },
    { sector: 'Railways', primary_driver: 'Forest & Environmental Clearances', primary_impact_pct: 34.2, secondary_driver: 'Scope Revisions', risk_exposure: 'High' },
    { sector: 'Coal & Mining', primary_driver: 'Forest & Environmental Clearances', primary_impact_pct: 42.0, secondary_driver: 'Land Compensation', risk_exposure: 'Medium' },
    { sector: 'Oil & Gas', primary_driver: 'Scope & Technical Modifications', primary_impact_pct: 36.8, secondary_driver: 'Raw Material Inflation', risk_exposure: 'Medium' },
    { sector: 'Power & Transmission', primary_driver: 'Right-of-Way (RoW) & Forest Clearances', primary_impact_pct: 33.1, secondary_driver: 'Contractor Execution', risk_exposure: 'Medium' },
    { sector: 'Aviation', primary_driver: 'Scope & Terminal Design Revisions', primary_impact_pct: 41.5, secondary_driver: 'Airlines Protocol Upgrades', risk_exposure: 'Low' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-14">
      {/* HEADER SECTION */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1E1E] text-[#FAF9F5] text-[11px] font-mono font-semibold">
              <TrendingUp size={13} className="text-[#D97706]" />
              <span>Module f: Cost Escalation Driver Analysis</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1A] tracking-tight">
              Cost Escalation Drivers & What-If Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#655E4E] leading-relaxed">
              Empirical quantification of capital drift drivers across 1,760 infrastructure assets. Test real-time statutory interventions to simulate delay mitigation and avoided capital loss.
            </p>
          </div>

          {/* Quick Driver Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono bg-[#FAF9F5]/90 p-4 rounded-xl border border-[rgba(61,58,52,0.08)] shrink-0">
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">#1 Driver</span>
              <span className="text-sm sm:text-base font-bold text-[#C25E3E] block">Scope Revisions</span>
              <span className="text-[10px] text-[#655E4E]">31.4% Attribution</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">#2 Driver</span>
              <span className="text-sm sm:text-base font-bold text-[#D97706] block">Land Bottlenecks</span>
              <span className="text-[10px] text-[#655E4E]">26.8% Attribution</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">Clearances</span>
              <span className="text-sm sm:text-base font-bold text-[#2C3E50] block">Env / Forest</span>
              <span className="text-[10px] text-[#655E4E]">18.2% Attribution</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MACRO COST ESCALATION DRIVERS (TORNADO / IMPACT BARS) */}
      <div className="glass-card p-5 sm:p-7 rounded-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">
              Systemic Cost Escalation Attribution Breakdown
            </h2>
            <p className="text-xs text-[#8D8574]">
              Portfolio-wide impact share (%) and project frequency for each major friction source
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {globalDrivers.map((d) => (
            <div key={d.id} className="p-4 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    d.severity === 'Critical' ? 'badge-sienna' :
                    d.severity === 'High' ? 'badge-amber' :
                    'badge-indigo'
                  }`}>
                    {d.severity}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1B1C1A]">{d.name}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                  <span className="text-[#655E4E]">{d.affected_projects_count} assets affected</span>
                  <span className="font-bold text-[#1B1C1A]">Avg +₹{d.avg_cost_impact_cr} Cr</span>
                  <span className="font-bold text-[#D97706] text-sm">{d.impact_share_pct}%</span>
                </div>
              </div>

              {/* Visual Tornado Bar */}
              <div className="w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-700 ${
                    d.severity === 'Critical' ? 'bg-[#C25E3E]' :
                    d.severity === 'High' ? 'bg-[#D97706]' :
                    'bg-[#2C3E50]'
                  }`}
                  style={{ width: `${d.impact_share_pct * 2.8}%` }}
                />
              </div>

              <p className="text-[11px] text-[#655E4E] leading-relaxed">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SECTOR DOMINANCE MATRIX */}
      <div className="glass-card p-5 sm:p-7 rounded-2xl space-y-4">
        <div>
          <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">
            Sector Primary Driver Dominance Matrix
          </h2>
          <p className="text-xs text-[#8D8574]">
            Empirical primary cause of delay and budget expansion across premier sectors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectorMatrix.map((sm) => (
            <div key={sm.sector} className="p-4 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-sm text-[#1B1C1A]">{sm.sector}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sm.risk_exposure === 'High' ? 'badge-sienna' :
                  sm.risk_exposure === 'Medium' ? 'badge-amber' :
                  'badge-nominal'
                }`}>
                  {sm.risk_exposure} Exposure
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-[rgba(61,58,52,0.06)]">
                <div className="text-[#8D8574] text-[10px] uppercase">Primary Escalation Trigger</div>
                <div className="text-[#C25E3E] font-bold">{sm.primary_driver} ({sm.primary_impact_pct}%)</div>
              </div>

              <div className="space-y-1">
                <div className="text-[#8D8574] text-[10px] uppercase">Secondary Trigger</div>
                <div className="text-[#655E4E]">{sm.secondary_driver}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE "WHAT-IF" INTERVENTION SIMULATOR */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6 border-2 border-[rgba(217,119,6,0.25)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(61,58,52,0.08)]">
          <div className="space-y-1">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1B1C1A] flex items-center gap-2">
              <Sliders size={20} className="text-[#D97706]" />
              Interactive "What-If" Strategic Intervention Simulator
            </h2>
            <p className="text-xs text-[#8D8574]">
              Select any active asset, adjust regulatory & operational constraints, and view projected schedule and fiscal recovery.
            </p>
          </div>

          <button
            onClick={handleResetToggles}
            className="btn-sovereign-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Toggles</span>
          </button>
        </div>

        {/* Project Selector Bar */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)] space-y-2">
          <label className="text-xs font-bold text-[#1B1C1A] block font-mono">
            Select Target Asset to Simulate:
          </label>
          <select
            value={selectedProjectId}
            onChange={handleSelectProject}
            className="w-full p-2.5 rounded-xl bg-white border border-[rgba(61,58,52,0.15)] text-xs font-sans text-[#1B1C1A] focus:outline-none focus:border-[#1E1E1E]"
          >
            {projectsList.map(p => (
              <option key={p.project_id} value={p.project_id}>
                [{p.project_id}] {p.project_name} — {p.sector} (Risk: {p.risk_score})
              </option>
            ))}
          </select>
        </div>

        {/* Baseline Telemetry Strip */}
        {projectForecast && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#EFECE6]/70 border border-[rgba(61,58,52,0.08)] font-mono text-xs tabular-nums">
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">Sanctioned Cost</span>
              <span className="font-bold text-[#1B1C1A]">₹ {projectForecast.sanctioned_cost_cr} Cr</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">Baseline Projected Cost</span>
              <span className="font-bold text-[#D97706]">₹ {projectForecast.predicted_final_cost_cr} Cr (+{projectForecast.predicted_cost_overrun_pct}%)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">Projected Delay</span>
              <span className="font-bold text-[#C25E3E]">+{projectForecast.predicted_delay_months} Months</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#8D8574] block">Sector Duration Factor</span>
              <span className="font-bold text-[#2C3E50]">{projectForecast.historical_sector_multiplier}x multiplier</span>
            </div>
          </div>
        )}

        {/* Intervention Toggle Checkboxes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8574] font-mono">
            Apply Strategic Interventions:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              landComplete ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Expedite Land Acquisition</span>
                <span className={`text-[10px] ${landComplete ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Resolve 100% RoW litigation</span>
              </div>
              <input
                type="checkbox"
                checked={landComplete}
                onChange={(e) => setLandComplete(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              envObtained ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Fast-Track Env Clearance</span>
                <span className={`text-[10px] ${envObtained ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Accelerate MoEFCC approval</span>
              </div>
              <input
                type="checkbox"
                checked={envObtained}
                onChange={(e) => setEnvObtained(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              forestObtained ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Fast-Track Forest Clearance</span>
                <span className={`text-[10px] ${forestObtained ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>State Wildlife Board NOC</span>
              </div>
              <input
                type="checkbox"
                checked={forestObtained}
                onChange={(e) => setForestObtained(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              freezeRevisions ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Freeze Scope & Design</span>
                <span className={`text-[10px] ${freezeRevisions ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Zero subsequent modifications</span>
              </div>
              <input
                type="checkbox"
                checked={freezeRevisions}
                onChange={(e) => setFreezeRevisions(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              resolveDisputes ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Conciliate Disputes</span>
                <span className={`text-[10px] ${resolveDisputes ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Arbitral settlement / liquidity</span>
              </div>
              <input
                type="checkbox"
                checked={resolveDisputes}
                onChange={(e) => setResolveDisputes(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="btn-sovereign-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
          >
            {simulating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} className="text-[#D97706]" />}
            <span>{simulating ? 'Computing Calibrated Trajectory...' : 'Simulate Intervention Impact'}</span>
          </button>
        </div>

        {/* SIMULATION RESULTS PANEL */}
        {simResult && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#1E1E1E] text-[#FAF9F5] space-y-5 border border-white/10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-[#4A5D4E]" />
                <h3 className="font-serif font-bold text-base text-[#FAF9F5]">
                  Intervention Impact Assessment
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#A39D8F]">
                Calibrated via MoSPI Sector Velocity Index
              </span>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Schedule Recovered</span>
                <span className="text-2xl font-bold font-mono text-[#4A5D4E] tabular-nums">
                  -{simResult.impact_summary.delay_saved_months} Months
                </span>
                <span className="text-[11px] text-[#EFECE6] block">
                  New delay: {simResult.simulated.predicted_delay_months} Mo (was {simResult.baseline.predicted_delay_months} Mo)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Capital Preserved</span>
                <span className="text-2xl font-bold font-mono text-[#D97706] tabular-nums">
                  ₹ {simResult.impact_summary.cost_saved_cr} Cr
                </span>
                <span className="text-[11px] text-[#EFECE6] block">
                  Overrun drops by -{simResult.impact_summary.cost_pct_reduction}%
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Recalibrated Completion</span>
                <span className="text-lg font-bold font-mono text-[#FAF9F5] block">
                  {new Date(simResult.simulated.completion_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <span className="text-[11px] text-[#A39D8F] block">
                  Baseline was: {new Date(simResult.baseline.completion_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* AI Policy Directive Commentary */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EFECE6] leading-relaxed">
              <span className="font-serif font-semibold text-[#D97706] mr-1.5">Strategic Policy Recommendation:</span>
              <span className="font-serif italic">
                "{simResult.impact_summary.recommendation}"
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
