import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  Activity,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Compass,
  Shield,
  FileCheck,
  Scale,
  Printer,
  Download,
  X,
  ExternalLink,
  Award,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { 
  getProjectDetail, 
  runProjectPredict, 
  runProjectExplain, 
  getAlerts, 
  resolveAlert,
  getProjectForecast,
  getProjectPrescriptions 
} from '../utils/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [prescriptionsData, setPrescriptionsData] = useState(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadProject() {
      try {
        setLoading(true);
        const [projRes, predRes, shapRes, alRes, fcRes, rxRes] = await Promise.all([
          getProjectDetail(id),
          runProjectPredict(id),
          runProjectExplain(id),
          getAlerts({ limit: 20 }),
          getProjectForecast(id).catch(() => null),
          getProjectPrescriptions(id).catch(() => null)
        ]);
        setProject(projRes);
        setPredictions(predRes.predictions);
        setShapData(shapRes.explanation);
        setForecast(fcRes);
        setPrescriptionsData(rxRes);
        
        const projAlerts = (alRes.alerts || []).filter(a => a.project_id === id);
        setAlerts(projAlerts);
      } catch (err) {
        console.error('Failed to load project detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const [predRes, shapRes, rxRes] = await Promise.all([
        runProjectPredict(id),
        runProjectExplain(id),
        getProjectPrescriptions(id).catch(() => null)
      ]);
      setPredictions(predRes.predictions);
      setShapData(shapRes.explanation);
      if (rxRes) setPrescriptionsData(rxRes);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      setAlerts(alerts.filter(a => a.alert_id !== alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-72 sm:h-96">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#8D8574]">Retrieving sovereign asset intelligence stream...</p>
        </div>
      </div>
    );
  }

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const riskVal = project.risk_score || 50;
  const strokeOffset = circumference - (riskVal / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Back Button & Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link 
          to="/" 
          className="btn-sovereign-secondary inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-semibold transition-all"
        >
          <ArrowLeft size={14} /> <span>Back to Surveillance</span>
        </Link>
        <span className="text-[11px] font-mono text-[#655E4E] bg-[#EFECE6] border border-[rgba(61,58,52,0.1)] px-3 py-1 rounded-full font-semibold">
          Asset ID: {project.project_id}
        </span>
      </div>

      {/* HEADER HERO SECTION */}
      <div className="glass-card p-5 sm:p-7 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Project Identity */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1E1E1E] text-[#FAF9F5] border border-white/10">
                {project.sector}
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono text-[#3D3A34] bg-[#EFECE6] border border-[rgba(61,58,52,0.1)]">
                {project.state} ({project.district})
              </span>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono text-[#655E4E] bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)]">
                Agency: {project.implementing_agency}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#1B1C1A] tracking-tight leading-snug">
              {project.project_name}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-[#8D8574] font-mono">
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Sanction Date</span>
                <span className="text-[#1B1C1A] font-bold truncate block">{project.start_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Planned Commission</span>
                <span className="text-[#1B1C1A] font-bold truncate block">{project.expected_end_date || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Sanctioned Cost</span>
                <span className="text-[#1B1C1A] font-bold tabular-nums">Rs. {project.sanctioned_cost} Cr</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-[#8D8574]">Revised Cost</span>
                <span className="text-[#D97706] font-bold tabular-nums">Rs. {project.revised_cost} Cr</span>
              </div>
            </div>
          </div>

          {/* SVG Circular Risk Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)]">
            <div className="relative flex items-center justify-center">
              <svg width="130" height="130" className="transform -rotate-90">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="rgba(61, 58, 52, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={project.risk_score >= 65 ? '#C25E3E' : project.risk_score >= 35 ? '#D97706' : '#4A5D4E'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1B1C1A] tabular-nums">
                  {project.risk_score}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-[#8D8574]">
                  {project.risk_category} Risk
                </span>
              </div>
            </div>

            {/* Probability Meters */}
            <div className="grid grid-cols-2 gap-3 w-full mt-3 pt-3 border-t border-[rgba(61,58,52,0.08)] text-center font-mono">
              <div>
                <span className="text-[10px] text-[#8D8574] block font-semibold">Cost Drift</span>
                <span className="text-xs sm:text-sm font-bold text-[#D97706] tabular-nums">
                  {Math.round((predictions?.cost_overrun_probability || 0.2) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8D8574] block font-semibold">Schedule Slippage</span>
                <span className="text-xs sm:text-sm font-bold text-[#2C3E50] tabular-nums">
                  {Math.round((predictions?.time_overrun_probability || 0.3) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EMPIRICAL HISTORICAL FORECAST & STATUTORY BENCHMARK MONITOR */}
      {forecast && (
        <div className="glass-card p-5 sm:p-7 rounded-2xl space-y-4 border-2 border-[rgba(217,119,6,0.2)] bg-gradient-to-br from-[#FAF9F5] to-[#FAF9F5]/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(61,58,52,0.08)]">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={20} className="text-[#D97706]" />
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A]">
                  AI-Powered Historical Forecast & Delivery Calibration
                </h2>
                <p className="text-[11px] text-[#8D8574]">
                  Benchmarked against 276 completed MoSPI projects in {forecast.sector} (Duration Multiplier: {forecast.historical_sector_multiplier}x)
                </p>
              </div>
            </div>

            <Link
              to="/drivers"
              className="btn-sovereign-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center"
            >
              <Sliders size={13} />
              <span>Simulate What-If Scenarios</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono tabular-nums">
            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] block font-semibold">Predicted Final Cost</span>
              <span className="text-lg sm:text-xl font-bold text-[#1B1C1A] block">
                ₹ {forecast.predicted_final_cost_cr} Cr
              </span>
              <span className="text-[11px] text-[#D97706] font-bold block">
                +₹ {forecast.predicted_cost_overrun_cr} Cr (+{forecast.predicted_cost_overrun_pct}%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] block font-semibold">Predicted Delay</span>
              <span className="text-lg sm:text-xl font-bold text-[#C25E3E] block">
                +{forecast.predicted_delay_months} Months
              </span>
              <span className="text-[11px] text-[#655E4E] block">
                Total: {forecast.predicted_total_duration_months} Mo (Sanction: {forecast.sanctioned_duration_months} Mo)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] block font-semibold">Projected Commissioning</span>
              <span className="text-base sm:text-lg font-bold text-[#1B1C1A] block">
                {new Date(forecast.predicted_completion_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[11px] text-[#2C3E50] block">
                {forecast.predicted_remaining_months} Months Remaining
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] block font-semibold">Peer Velocity Index</span>
              <span className="text-lg sm:text-xl font-bold text-[#2D3A30] block">
                {forecast.peer_velocity_index}x
              </span>
              <span className="text-[11px] text-[#655E4E] block">
                Relative to completed sector peers
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MIDDLE SECTION — TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Project Info & Parameters */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-5">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A] flex items-center gap-2">
              <FileText size={17} className="text-[#D97706]" />
              Operational & Fiscal Telemetry
            </h2>

            {/* Cost Progress Stacked Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#655E4E]">Budget Utilization</span>
                <span className="text-[#1B1C1A] font-bold tabular-nums">
                  Rs. {project.actual_expenditure} / {project.revised_cost} Cr
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EFECE6] border border-[rgba(61,58,52,0.08)] overflow-hidden flex">
                <div 
                  className="bg-[#1E1E1E] h-full transition-all duration-700" 
                  style={{ width: `${Math.min(100, (project.actual_expenditure / project.revised_cost) * 100)}%` }}
                />
              </div>
            </div>

            {/* Physical vs Financial Progress */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] space-y-1">
                <span className="text-[11px] text-[#8D8574] block font-semibold">Physical Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-[#4A5D4E] tabular-nums">
                  {project.physical_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div className="bg-[#4A5D4E] h-full" style={{ width: `${project.physical_progress}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] space-y-1">
                <span className="text-[11px] text-[#8D8574] block font-semibold">Financial Progress</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-[#D97706] tabular-nums">
                  {project.financial_progress}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                  <div className="bg-[#D97706] h-full" style={{ width: `${project.financial_progress}%` }} />
                </div>
              </div>
            </div>

            {/* Clearances Grid */}
            <div className="pt-1">
              <h3 className="text-xs font-bold text-[#8D8574] uppercase tracking-wider mb-2.5">
                Key Statutory & Execution Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Land Acq:</span>
                  <span className={project.land_acquisition_status === 'Complete' ? 'text-[#2D3A30] font-bold' : 'text-[#D97706] font-bold'}>
                    {project.land_acquisition_status}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Env Clear:</span>
                  <span className={project.environment_clearance === 'Obtained' ? 'text-[#2D3A30] font-bold' : 'text-[#D97706] font-bold'}>
                    {project.environment_clearance}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Revisions:</span>
                  <span className={project.revision_count > 1 ? 'text-[#C25E3E] font-bold' : 'text-[#1B1C1A]'}>
                    {project.revision_count} Rounds
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Extensions:</span>
                  <span className={project.no_of_extensions > 0 ? 'text-[#D97706] font-bold' : 'text-[#1B1C1A]'}>
                    {project.no_of_extensions} Granted
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Quality Audit:</span>
                  <span className="text-[#1E1E1E] font-bold">{project.inspection_score}/10</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.08)] flex justify-between items-center">
                  <span className="text-[#8D8574]">Contractor:</span>
                  <span className="text-[#1B1C1A] font-semibold truncate max-w-[110px]" title={project.contractor_name}>
                    {project.contractor_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis & SHAP (Level 2: The Monolith Card) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="monolith-card p-5 sm:p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#FAF9F5] flex items-center gap-2">
                  <Sparkles size={17} className="text-[#D97706]" />
                  SHAP Explainability Attribution
                </h2>
                <p className="text-xs text-[#A39D8F]">TreeExplainer root-cause attribution</p>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="btn-sovereign-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 border border-white/20 hover:border-white/40 shadow-sm shrink-0"
              >
                {analyzing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} className="text-[#D97706]" />}
                <span>{analyzing ? 'Evaluating...' : 'Run Analysis'}</span>
              </button>
            </div>

            {/* AI Summary Text (Newsreader Italic Commentary) */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EFECE6] leading-relaxed">
              <span className="font-serif font-semibold text-[#D97706] mr-1.5 not-italic">AI Forensic Evaluation:</span>
              <span className="font-serif italic">
                "{shapData?.summary || 'Project displays nominal baseline execution patterns with standard operational tolerances.'}"
              </span>
            </div>

            {/* SHAP Factor Impact Bars */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-[#A39D8F] uppercase tracking-wider">
                Top 5 Risk Determination Drivers
              </h3>
              
              <div className="space-y-2.5">
                {(shapData?.top_drivers || []).map((d) => (
                  <div key={d.feature} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#FAF9F5] truncate pr-2">{d.label}</span>
                      <span className={`font-mono font-bold shrink-0 ${d.direction === 'increases_risk' ? 'text-[#C25E3E]' : 'text-[#4A5D4E]'}`}>
                        {d.direction === 'increases_risk' ? `+${d.impact}% Risk` : `-${d.impact}% Stabilizer`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${d.direction === 'increases_risk' ? 'bg-[#C25E3E]' : 'bg-[#4A5D4E]'}`}
                        style={{ width: `${Math.min(100, Math.max(10, d.impact * 1.5))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 3: PRESCRIPTIVE DECISION-SUPPORT HUB */}
      {prescriptionsData && (
        <div className="glass-card p-6 sm:p-8 rounded-2xl space-y-6 border-2 border-[rgba(217,119,6,0.25)] shadow-sm">
          {/* Paradigm Evolution Stepper */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[rgba(61,58,52,0.08)]">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1E1E] text-[#FAF9F5] text-[11px] font-mono font-semibold">
                <Compass size={13} className="text-[#D97706]" />
                <span>Tier 3: Prescriptive Decision-Support Engine</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1B1C1A] tracking-tight">
                Evidence-Based Administrative Prescriptions
              </h2>
              <p className="text-xs sm:text-sm text-[#655E4E] leading-relaxed">
                Transforming predictive failure indicators into ranked, evidence-based policy directives with quantified schedule recovery and capital preservation ROI.
              </p>
            </div>

            {/* Combined Impact & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.1)] text-right font-mono text-xs">
                <span className="text-[10px] text-[#8D8574] block uppercase">Strategic Recovery Potential</span>
                <span className="text-sm sm:text-base font-bold text-[#4A5D4E]">
                  -{prescriptionsData.combined_impact.total_delay_recovered_months} Mo
                </span>
                <span className="text-xs text-[#D97706] font-bold ml-2">
                  ₹ {prescriptionsData.combined_impact.total_capital_preserved_cr} Cr
                </span>
              </div>

              <button
                onClick={() => setShowMemoModal(true)}
                className="btn-sovereign-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <FileCheck size={14} className="text-[#D97706]" />
                <span>Generate Executive Decision Memo</span>
              </button>

              <Link
                to="/drivers"
                className="btn-sovereign-secondary px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders size={13} />
                <span>Test in What-If Simulator</span>
              </Link>
            </div>
          </div>

          {/* Three-Tier Pipeline Stepper Badge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] font-bold block">1. Descriptive Telemetry</span>
              <span className="text-[#1B1C1A] font-semibold block">Ground Physical & Fiscal Progress</span>
              <span className="text-[10px] text-[#655E4E] block">Physical: {project.physical_progress}% | Financial: {project.financial_progress}%</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1">
              <span className="text-[10px] uppercase text-[#8D8574] font-bold block">2. Predictive Intelligence</span>
              <span className="text-[#C25E3E] font-semibold block">Forecasted Trajectory & SHAP Drivers</span>
              <span className="text-[10px] text-[#655E4E] block">Delay: +{prescriptionsData.current_status.predicted_delay_months} Mo | Overrun: +{prescriptionsData.current_status.predicted_cost_overrun_pct}%</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E1E] text-[#FAF9F5] border border-white/10 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase text-[#D97706] font-bold block">3. Prescriptive Decision Support</span>
              <span className="text-white font-semibold block">{prescriptionsData.prescriptions.length} Targeted Administrative Prescriptions</span>
              <span className="text-[10px] text-[#EFECE6] block">Actionable statutory & contractual directives</span>
            </div>
          </div>

          {/* Ranked Prescriptions Grid */}
          <div className="space-y-4">
            {prescriptionsData.prescriptions.map((rx) => (
              <div 
                key={rx.id}
                className="p-4 sm:p-5 rounded-xl bg-[#FAF9F5]/90 border border-[rgba(61,58,52,0.12)] space-y-3 transition-all hover:border-[#1E1E1E]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1E1E1E] text-[#FAF9F5] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {rx.rank}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      rx.priority.includes('Critical') ? 'badge-sienna' :
                      rx.priority.includes('High') ? 'badge-amber' :
                      'badge-indigo'
                    }`}>
                      {rx.priority}
                    </span>
                    <span className="text-[10px] font-mono text-[#8D8574] bg-[#EFECE6] px-2 py-0.5 rounded-md">
                      {rx.action_type}
                    </span>
                  </div>

                  {/* Quantified Impact Pills */}
                  <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span className="font-bold text-[#4A5D4E] bg-[#4A5D4E]/10 px-2.5 py-0.5 rounded-full border border-[#4A5D4E]/20">
                      -{rx.expected_delay_recovered_months} Months Recovered
                    </span>
                    <span className="font-bold text-[#D97706] bg-[#D97706]/10 px-2.5 py-0.5 rounded-full border border-[#D97706]/20">
                      ₹ {rx.expected_capital_preserved_cr} Cr Preserved
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#1B1C1A]">
                    {rx.title}
                  </h3>
                  <p className="text-xs text-[#3D3A34] leading-relaxed bg-white/70 p-3 rounded-lg border border-[rgba(61,58,52,0.06)] font-sans">
                    <strong className="text-[#1B1C1A]">Operative Order: </strong>
                    {rx.decision_order}
                  </p>
                </div>

                {/* Authority & Evidence Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-[#655E4E]">
                  <div>
                    <span className="text-[#8D8574] text-[10px] uppercase block">Designated Authority:</span>
                    <span className="font-semibold text-[#1B1C1A]">{rx.responsible_authority}</span>
                  </div>
                  <div>
                    <span className="text-[#8D8574] text-[10px] uppercase block">Statutory Reference:</span>
                    <span className="text-[#2C3E50]">{rx.statutory_reference}</span>
                  </div>
                  <div>
                    <span className="text-[#8D8574] text-[10px] uppercase block">Compliance Lead Time:</span>
                    <span className="font-semibold text-[#D97706]">{rx.timeline_days} Calendar Days</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#8D8574] font-mono pt-1 border-t border-[rgba(61,58,52,0.06)] flex items-start gap-1.5">
                  <span className="font-bold text-[#D97706] shrink-0">Evidence Cited:</span>
                  <span className="italic text-[#655E4E]">{rx.evidence_base}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXECUTIVE DECISION MEMORANDUM & STATUTORY DIRECTIVE MODAL */}
      {showMemoModal && prescriptionsData?.executive_decision_memo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF9F5] w-full max-w-3xl rounded-2xl border border-[rgba(61,58,52,0.2)] shadow-2xl p-4 sm:p-8 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            {/* Memo Official Header */}
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b-2 border-[#1E1E1E]">
              <div className="space-y-1 pr-2">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#8D8574] block font-bold">
                  Government of India — Cabinet Secretariat / MoSPI
                </span>
                <h2 className="font-serif text-base sm:text-xl font-bold text-[#1B1C1A]">
                  EXECUTIVE DECISION MEMORANDUM & STATUTORY DIRECTIVE
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono pt-1">
                  <span className="text-[#D97706] font-bold">Ref: {prescriptionsData.executive_decision_memo.memo_reference}</span>
                  <span className="text-[#8D8574]">| Date: {prescriptionsData.executive_decision_memo.date}</span>
                  <span className="badge-sienna text-[9px] px-2 py-0.5 rounded uppercase font-bold">
                    {prescriptionsData.executive_decision_memo.classification}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowMemoModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#8D8574] cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Memo Subject */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[rgba(61,58,52,0.12)] font-mono text-xs">
              <span className="text-[#8D8574] uppercase text-[10px] block font-bold">SUBJECT:</span>
              <span className="font-bold text-[#1B1C1A] text-xs sm:text-sm">
                {prescriptionsData.executive_decision_memo.subject}
              </span>
            </div>

            {/* Forensic Diagnosis */}
            <div className="space-y-1.5 sm:space-y-2 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-[#1B1C1A] uppercase tracking-wide">
                1. Forensic Predictive Assessment & Ground Evidence:
              </h4>
              <p className="text-[#3D3A34] bg-white/60 p-3 sm:p-3.5 rounded-xl border border-[rgba(61,58,52,0.08)]">
                {prescriptionsData.executive_decision_memo.forensic_diagnosis}
              </p>
            </div>

            {/* Operative Orders */}
            <div className="space-y-1.5 sm:space-y-2 text-xs leading-relaxed">
              <h4 className="font-serif font-bold text-[#1B1C1A] uppercase tracking-wide">
                2. Operative Prescriptive Directives (Under PMG Empowered Mandate):
              </h4>
              <div className="space-y-2">
                {prescriptionsData.executive_decision_memo.operative_statutory_orders.map((order, idx) => (
                  <div key={idx} className="p-2.5 sm:p-3 rounded-xl bg-white border border-[rgba(61,58,52,0.1)] text-[#1B1C1A] font-mono text-[11px]">
                    <strong className="text-[#C25E3E] mr-1.5">●</strong>
                    {order}
                  </div>
                ))}
              </div>
            </div>

            {/* Quantified Return Summary */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#1E1E1E] text-[#FAF9F5] font-mono text-xs space-y-2">
              <span className="text-[10px] uppercase text-[#D97706] font-bold block">
                3. Quantified Impact on Full Directive Compliance:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-[#A39D8F] block">Critical Delay Recovered</span>
                  <span className="font-bold text-[#4A5D4E] text-sm sm:text-base">
                    -{prescriptionsData.executive_decision_memo.quantified_decision_return.schedule_recovered_months} Months
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A39D8F] block">Capital Overrun Preserved</span>
                  <span className="font-bold text-[#D97706] text-sm sm:text-base">
                    ₹ {prescriptionsData.executive_decision_memo.quantified_decision_return.capital_preserved_cr} Cr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A39D8F] block">Recalibrated Target</span>
                  <span className="font-bold text-white text-sm sm:text-base">
                    {new Date(prescriptionsData.executive_decision_memo.quantified_decision_return.recalibrated_commissioning_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Signoff Block & Actions */}
            <div className="pt-3 border-t border-[rgba(61,58,52,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="font-serif italic text-xs text-[#655E4E]">
                {prescriptionsData.executive_decision_memo.signoff}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-sovereign-secondary flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Memo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMemoModal(false)}
                  className="btn-sovereign-primary flex-1 sm:flex-initial px-4 sm:px-5 py-2 text-xs font-semibold text-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION: ACTIVE ALERTS */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#1B1C1A] flex items-center gap-2">
          <AlertTriangle size={17} className="text-[#D97706]" />
          Active Warnings for Project [{project.project_id}]
        </h2>

        {alerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FAF9F5]/70 border border-[rgba(61,58,52,0.08)] text-center text-xs text-[#8D8574]">
            <CheckCircle size={24} className="text-[#4A5D4E] mx-auto mb-2" />
            No active unresolved alerts recorded for this asset.
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map(a => (
              <div 
                key={a.alert_id} 
                className={`p-3.5 rounded-xl bg-[#FAF9F5]/70 backdrop-blur-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  a.severity === 'CRITICAL' ? 'border-l-4 border-l-[#C25E3E] border-[rgba(194,94,62,0.2)]' :
                  a.severity === 'HIGH' ? 'border-l-4 border-l-[#D97706] border-[rgba(217,119,6,0.2)]' :
                  'border-l-4 border-l-[#2C3E50] border-[rgba(44,62,80,0.2)]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      a.severity === 'CRITICAL' ? 'badge-sienna' :
                      a.severity === 'HIGH' ? 'badge-amber' :
                      'badge-indigo'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-bold text-[#1B1C1A]">{a.alert_type}</span>
                  </div>
                  <p className="text-xs text-[#655E4E]">{a.message}</p>
                </div>

                <button
                  onClick={() => handleResolve(a.alert_id)}
                  className="btn-sovereign-secondary px-3.5 py-1 text-xs font-semibold self-start sm:self-auto shrink-0 hover:bg-[#4A5D4E] hover:text-white hover:border-[#4A5D4E] transition-all"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
