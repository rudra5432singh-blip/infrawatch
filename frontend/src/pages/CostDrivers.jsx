import React, { useState, useEffect, useMemo } from 'react';
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
  FileCheck,
  Filter,
  Flame,
  Scale,
  Lock,
  Compass,
  Check,
  AlertCircle
} from 'lucide-react';
import { getCostDrivers, getProjects, simulateProjectIntervention, getProjectForecast } from '../utils/api';

export default function CostDrivers() {
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  // Selected Target Project
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForecast, setProjectForecast] = useState(null);

  // Intervention Sensitivity Controls
  const [landComplete, setLandComplete] = useState(false);
  const [envCleared, setEnvCleared] = useState(false);
  const [forestCleared, setForestCleared] = useState(false);
  const [freezeScope, setFreezeScope] = useState(false);
  const [resolveDisputes, setResolveDisputes] = useState(false);
  const [velocityBoost, setVelocityBoost] = useState(0);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [drivers, projs] = await Promise.all([
          getCostDrivers().catch(() => null),
          getProjects({ page_size: 200, sort_by: 'risk_score', order: 'desc' }).catch(() => ({ projects: [] }))
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

  // Filtered project list for dropdown
  const filteredProjects = useMemo(() => {
    return projectsList.filter(p => {
      const matchSearch = !searchQuery || 
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.project_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = sectorFilter === 'All' || p.sector === sectorFilter;
      const matchRisk = riskFilter === 'All' || p.risk_category === riskFilter;
      return matchSearch && matchSector && matchRisk;
    });
  }, [projectsList, searchQuery, sectorFilter, riskFilter]);

  // One-Click Strategic Policy Presets
  const applyPreset = (presetKey) => {
    if (presetKey === 'max') {
      setLandComplete(true);
      setEnvCleared(true);
      setForestCleared(true);
      setFreezeScope(true);
      setResolveDisputes(true);
      setVelocityBoost(25);
    } else if (presetKey === 'statutory') {
      setLandComplete(true);
      setEnvCleared(true);
      setForestCleared(true);
      setFreezeScope(false);
      setResolveDisputes(false);
      setVelocityBoost(0);
    } else if (presetKey === 'freeze') {
      setLandComplete(false);
      setEnvCleared(false);
      setForestCleared(false);
      setFreezeScope(true);
      setResolveDisputes(false);
      setVelocityBoost(0);
    } else if (presetKey === 'conciliation') {
      setLandComplete(false);
      setEnvCleared(false);
      setForestCleared(false);
      setFreezeScope(false);
      setResolveDisputes(true);
      setVelocityBoost(15);
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedProjectId) return;
    setSimulating(true);

    const adjustments = {};
    if (landComplete) adjustments.land_acquisition_status = 'Complete';
    if (envCleared) adjustments.environment_clearance = 'Cleared';
    if (forestCleared) adjustments.forest_clearance = 'Cleared';
    if (freezeScope) {
      adjustments.revision_count = 0;
      adjustments.scope_freeze = true;
    }
    if (resolveDisputes) adjustments.disputes_count = 0;
    if (velocityBoost > 0) adjustments.velocity_boost_pct = velocityBoost;

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
    setEnvCleared(false);
    setForestCleared(false);
    setFreezeScope(false);
    setResolveDisputes(false);
    setVelocityBoost(0);
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
              <span>Module f: Cost Escalation Driver Analysis & What-If Simulation</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1A] tracking-tight">
              Cost Escalation Drivers & Strategic Intervention Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#655E4E] leading-relaxed">
              Empirical quantification of capital drift drivers across 1,760 infrastructure assets. Test real-time statutory interventions and multi-shift acceleration to simulate delay mitigation and avoided capital loss.
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
              Portfolio-wide impact share (%) and asset frequency for each empirical friction source
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
            Empirical primary cause of delay and budget expansion across premier infrastructure sectors
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
      <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6 border-2 border-[rgba(217,119,6,0.3)] shadow-sm">
        {/* Simulator Title & Reset Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(61,58,52,0.08)]">
          <div className="space-y-1">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1B1C1A] flex items-center gap-2">
              <Sliders size={20} className="text-[#D97706]" />
              Strategic Intervention "What-If" Simulator
            </h2>
            <p className="text-xs text-[#8D8574]">
              Model counter-factual policy, statutory, and contractor interventions on live assets to quantify critical-path schedule recovery and capital preservation.
            </p>
          </div>

          <button
            onClick={handleResetToggles}
            className="btn-sovereign-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Scenario</span>
          </button>
        </div>

        {/* Search & Project Selector Filter Bar */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)] space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D8574]" />
              <input
                type="text"
                placeholder="Search asset name or project ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[rgba(61,58,52,0.15)] text-[#1B1C1A] placeholder-[#8D8574] focus:outline-none focus:border-[#1E1E1E]"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-white border border-[rgba(61,58,52,0.15)] text-xs text-[#1B1C1A] focus:outline-none focus:border-[#1E1E1E] truncate"
              >
                <option value="All">All Sectors</option>
                <option value="Road Transport & Highways">Roads & Highways</option>
                <option value="Railways">Railways</option>
                <option value="Coal & Mining">Coal & Mining</option>
                <option value="Power & Transmission">Power</option>
                <option value="Civil Aviation">Aviation</option>
                <option value="Petroleum & Natural Gas">Petroleum</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-white border border-[rgba(61,58,52,0.15)] text-xs text-[#1B1C1A] focus:outline-none focus:border-[#1E1E1E] truncate"
              >
                <option value="All">All Risk Tiers</option>
                <option value="High">High Risk Only</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1B1C1A] block font-mono mb-1.5">
              Select Target Asset to Simulate ({filteredProjects.length} matching):
            </label>
            <select
              value={selectedProjectId}
              onChange={handleSelectProject}
              className="w-full p-2.5 rounded-xl bg-white border border-[rgba(61,58,52,0.2)] text-xs font-sans text-[#1B1C1A] font-medium focus:outline-none focus:border-[#1E1E1E]"
            >
              {filteredProjects.map(p => (
                <option key={p.project_id} value={p.project_id}>
                  [{p.project_id}] {p.project_name} — {p.sector} | Risk: {p.risk_score} ({p.risk_category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TARGET ASSET LIVE DIAGNOSTIC CARD */}
        {selectedProject && (
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D8574]">
                  Asset Baseline Diagnostics:
                </span>
                <span className="font-bold text-xs text-[#1B1C1A]">
                  {selectedProject.project_name}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                selectedProject.risk_category === 'High' ? 'badge-sienna' :
                selectedProject.risk_category === 'Medium' ? 'badge-amber' :
                'badge-nominal'
              }`}>
                Risk Score: {selectedProject.risk_score}/100 ({selectedProject.risk_category})
              </span>
            </div>

            {/* Current Bottleneck Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-[rgba(61,58,52,0.08)]">
                <span className="text-[10px] text-[#8D8574] block uppercase">Land Acquisition</span>
                <span className={`font-bold block mt-0.5 ${
                  selectedProject.land_acquisition_status === 'Complete' ? 'text-[#4A5D4E]' : 'text-[#C25E3E]'
                }`}>
                  {selectedProject.land_acquisition_status || 'Complete'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[rgba(61,58,52,0.08)]">
                <span className="text-[10px] text-[#8D8574] block uppercase">Forest Clearance</span>
                <span className={`font-bold block mt-0.5 ${
                  selectedProject.forest_clearance === 'Cleared' ? 'text-[#4A5D4E]' : 'text-[#D97706]'
                }`}>
                  {selectedProject.forest_clearance || 'Cleared'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[rgba(61,58,52,0.08)]">
                <span className="text-[10px] text-[#8D8574] block uppercase">Env Clearance</span>
                <span className={`font-bold block mt-0.5 ${
                  selectedProject.environment_clearance === 'Cleared' ? 'text-[#4A5D4E]' : 'text-[#D97706]'
                }`}>
                  {selectedProject.environment_clearance || 'Cleared'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[rgba(61,58,52,0.08)]">
                <span className="text-[10px] text-[#8D8574] block uppercase">Scope Revisions</span>
                <span className={`font-bold block mt-0.5 ${
                  (selectedProject.revision_count || 0) > 0 ? 'text-[#C25E3E]' : 'text-[#4A5D4E]'
                }`}>
                  {selectedProject.revision_count || 0} approved
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[rgba(61,58,52,0.08)]">
                <span className="text-[10px] text-[#8D8574] block uppercase">Active Disputes</span>
                <span className={`font-bold block mt-0.5 ${
                  (selectedProject.disputes_count || 0) > 0 ? 'text-[#C25E3E]' : 'text-[#4A5D4E]'
                }`}>
                  {selectedProject.disputes_count || 0} cases
                </span>
              </div>
            </div>

            {/* Diagnostic Alert Line */}
            <div className="text-[11px] flex items-center gap-2 text-[#655E4E] pt-1">
              <AlertCircle size={13} className="text-[#D97706] shrink-0" />
              <span>
                {selectedProject.land_acquisition_status !== 'Complete' || selectedProject.forest_clearance === 'Pending' || (selectedProject.revision_count || 0) > 0
                  ? `Active friction identified: Delay risks concentrated in ${[
                      selectedProject.land_acquisition_status !== 'Complete' ? 'Land Handover' : '',
                      selectedProject.forest_clearance === 'Pending' ? 'Forest Stage-II' : '',
                      (selectedProject.revision_count || 0) > 0 ? 'Scope Alterations' : '',
                      (selectedProject.disputes_count || 0) > 0 ? 'Arbitration Stalls' : ''
                    ].filter(Boolean).join(', ')}. Use interventions below to mitigate.`
                  : 'Asset currently operates with nominal statutory friction. Test multi-shift velocity injection below to accelerate commissioning.'}
              </span>
            </div>
          </div>
        )}

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
              <span className="text-[10px] uppercase text-[#8D8574] block">Peer Velocity Index</span>
              <span className="font-bold text-[#2C3E50]">{projectForecast.peer_velocity_index || 1.0}x benchmark</span>
            </div>
          </div>
        )}

        {/* 1-CLICK STRATEGIC POLICY PRESETS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8574] font-mono flex items-center gap-1.5">
              <Zap size={13} className="text-[#D97706]" />
              1-Click Strategic Policy Presets:
            </h3>
            <span className="text-[10px] text-[#8D8574] font-mono">Click to auto-configure interventions</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
            <button
              onClick={() => applyPreset('max')}
              className="p-2.5 sm:p-3 rounded-xl bg-white border border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E] text-left space-y-1 transition-all group cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center justify-between font-bold text-[#1B1C1A]">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs truncate">
                  <Flame size={13} className="text-[#C25E3E] shrink-0" />
                  Max Mitigation
                </span>
                <ArrowRight size={11} className="text-[#8D8574] group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:block" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#655E4E] leading-relaxed line-clamp-2">
                Clears Land, Forest, freezes scope, resolves disputes + 25% velocity.
              </p>
            </button>

            <button
              onClick={() => applyPreset('statutory')}
              className="p-2.5 sm:p-3 rounded-xl bg-white border border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E] text-left space-y-1 transition-all group cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center justify-between font-bold text-[#1B1C1A]">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs truncate">
                  <Scale size={13} className="text-[#D97706] shrink-0" />
                  Statutory Fast-Track
                </span>
                <ArrowRight size={11} className="text-[#8D8574] group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:block" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#655E4E] leading-relaxed line-clamp-2">
                Resolves 100% Land Handover, MoEFCC & Forest Stage-II approvals.
              </p>
            </button>

            <button
              onClick={() => applyPreset('freeze')}
              className="p-2.5 sm:p-3 rounded-xl bg-white border border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E] text-left space-y-1 transition-all group cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center justify-between font-bold text-[#1B1C1A]">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs truncate">
                  <Lock size={13} className="text-[#2C3E50] shrink-0" />
                  Design Freeze
                </span>
                <ArrowRight size={11} className="text-[#8D8574] group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:block" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#655E4E] leading-relaxed line-clamp-2">
                Halt scope modifications and cap uncommitted contractual inflation.
              </p>
            </button>

            <button
              onClick={() => applyPreset('conciliation')}
              className="p-2.5 sm:p-3 rounded-xl bg-white border border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E] text-left space-y-1 transition-all group cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center justify-between font-bold text-[#1B1C1A]">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs truncate">
                  <ShieldCheck size={13} className="text-[#4A5D4E] shrink-0" />
                  Conciliation
                </span>
                <ArrowRight size={11} className="text-[#8D8574] group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:block" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#655E4E] leading-relaxed line-clamp-2">
                Settle legal arbitrations and inject liquidity (+15% velocity).
              </p>
            </button>
          </div>
        </div>

        {/* INTERACTIVE SENSITIVITY CONTROLS */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8574] font-mono">
            Custom Intervention Toggles:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              landComplete ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Expedite Land Acquisition</span>
                <span className={`text-[10px] ${landComplete ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>100% RoW handover & compensation</span>
              </div>
              <input
                type="checkbox"
                checked={landComplete}
                onChange={(e) => setLandComplete(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              envCleared ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Fast-Track Env Clearance</span>
                <span className={`text-[10px] ${envCleared ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Accelerate MoEFCC single-window NOC</span>
              </div>
              <input
                type="checkbox"
                checked={envCleared}
                onChange={(e) => setEnvCleared(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              forestCleared ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Fast-Track Forest Clearance</span>
                <span className={`text-[10px] ${forestCleared ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>State Wildlife Board Stage-II NOC</span>
              </div>
              <input
                type="checkbox"
                checked={forestCleared}
                onChange={(e) => setForestCleared(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              freezeScope ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Freeze Scope & Design</span>
                <span className={`text-[10px] ${freezeScope ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Zero downstream amendments</span>
              </div>
              <input
                type="checkbox"
                checked={freezeScope}
                onChange={(e) => setFreezeScope(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            <label className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              resolveDisputes ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]' : 'bg-[#FAF9F5] text-[#1B1C1A] border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E]'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold block">Conciliate Disputes</span>
                <span className={`text-[10px] ${resolveDisputes ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>Arbitral settlement & vendor cashflow</span>
              </div>
              <input
                type="checkbox"
                checked={resolveDisputes}
                onChange={(e) => setResolveDisputes(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
            </label>

            {/* Velocity Booster Slider Card */}
            <div className="p-3.5 rounded-xl border bg-[#FAF9F5] border-[rgba(61,58,52,0.12)] space-y-1.5">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-[#1B1C1A]">Multi-Shift Velocity Booster</span>
                <span className="font-bold text-[#D97706]">+{velocityBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={velocityBoost}
                onChange={(e) => setVelocityBoost(Number(e.target.value))}
                className="w-full accent-[#D97706] cursor-pointer h-1.5 bg-[#EFECE6] rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-[#8D8574] font-mono">
                <span>0% (Standard)</span>
                <span>+25% (2-Shift)</span>
                <span>+50% (24/7 Fast-Track)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-stretch sm:justify-end pt-2">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="btn-sovereign-primary w-full sm:w-auto px-6 sm:px-7 py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {simulating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={15} className="text-[#D97706]" />}
            <span>{simulating ? 'Computing Calibrated Trajectory...' : 'Simulate Strategic Interventions'}</span>
          </button>
        </div>

        {/* SIMULATION RESULTS PANEL */}
        {simResult && (
          <div className="p-6 sm:p-7 rounded-2xl bg-[#1E1E1E] text-[#FAF9F5] space-y-6 border border-white/10 shadow-xl animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={22} className="text-[#4A5D4E]" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#FAF9F5]">
                    Intervention Impact Assessment & Fiscal Recovery
                  </h3>
                  <span className="text-[11px] text-[#A39D8F] block">
                    Target: [{simResult.project_id}] {simResult.project_name} ({simResult.sector})
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#D97706] bg-white/5 px-3 py-1 rounded-full border border-white/10 self-start sm:self-center">
                Calibrated via MoSPI Sector Velocity Index
              </span>
            </div>

            {/* Impact Metric Hero Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Critical Path Delay Recovered</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-[#4A5D4E] tabular-nums">
                    -{simResult.impact_summary.delay_saved_months}
                  </span>
                  <span className="text-sm font-mono text-[#4A5D4E]">Months Saved</span>
                </div>
                <div className="text-[11px] text-[#EFECE6] pt-1 border-t border-white/5 font-mono">
                  New delay: <strong className="text-white">+{simResult.simulated.predicted_delay_months} Mo</strong> (was +{simResult.baseline.predicted_delay_months} Mo)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Capital Overrun Preserved</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-[#D97706] tabular-nums">
                    ₹ {simResult.impact_summary.cost_saved_cr}
                  </span>
                  <span className="text-sm font-mono text-[#D97706]">Cr Avoided</span>
                </div>
                <div className="text-[11px] text-[#EFECE6] pt-1 border-t border-white/5 font-mono">
                  Overrun drops from <strong className="text-white">{simResult.baseline.predicted_cost_overrun_pct}%</strong> to <strong className="text-white">{simResult.simulated.predicted_cost_overrun_pct}%</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase text-[#A39D8F] block font-mono">Recalibrated Commissioning Date</span>
                <span className="text-2xl font-bold font-mono text-[#FAF9F5] block">
                  {new Date(simResult.simulated.completion_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <div className="text-[11px] text-[#A39D8F] pt-1 border-t border-white/5 font-mono">
                  Baseline was: <span className="line-through">{new Date(simResult.baseline.completion_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Detailed Comparative Breakdown */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase text-[#A39D8F] block">
                Side-by-Side Trajectory Comparison
              </span>
              <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/10 text-[11px] text-[#A39D8F]">
                <div>Metric</div>
                <div>Status Quo (Baseline)</div>
                <div className="text-[#D97706]">Mitigated Intervention</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] py-1 border-b border-white/5">
                <div className="text-[#EFECE6]">Remaining Horizon</div>
                <div>{simResult.baseline.predicted_remaining_months} Months</div>
                <div className="text-[#4A5D4E] font-bold">{simResult.simulated.predicted_remaining_months} Months</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] py-1 border-b border-white/5">
                <div className="text-[#EFECE6]">Final Anticipated Cost</div>
                <div>₹ {simResult.baseline.predicted_final_cost_cr} Cr</div>
                <div className="text-[#D97706] font-bold">₹ {simResult.simulated.predicted_final_cost_cr} Cr</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] py-1">
                <div className="text-[#EFECE6]">Velocity Ratio vs Completed Peers</div>
                <div>{simResult.baseline.peer_velocity_index}x</div>
                <div className="text-[#4A5D4E] font-bold">{simResult.simulated.peer_velocity_index}x</div>
              </div>
            </div>

            {/* AI Policy Directive Commentary */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EFECE6] leading-relaxed">
              <span className="font-serif font-semibold text-[#D97706] mr-1.5">Executive Strategic Directive:</span>
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

