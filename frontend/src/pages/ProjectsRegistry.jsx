import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  List, 
  LayoutGrid, 
  ExternalLink, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  X,
  Sliders,
  TrendingUp,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getProjects, getStatsSummary, getStatsSector, getStatsState } from '../utils/api';
import { useCountUp } from '../hooks/useCountUp';

export default function ProjectsRegistry() {
  // Data States
  const [projectsData, setProjectsData] = useState({ projects: [], total: 0, total_pages: 1 });
  const [summary, setSummary] = useState(null);
  const [sectorStats, setSectorStats] = useState([]);
  const [stateStats, setStateStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Debounce search input for snappy typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load High-Level Metadata Once
  useEffect(() => {
    async function loadMeta() {
      try {
        const [sumRes, secRes, stRes] = await Promise.all([
          getStatsSummary().catch(() => null),
          getStatsSector().catch(() => []),
          getStatsState().catch(() => null)
        ]);
        setSummary(sumRes);
        setSectorStats(secRes || []);
        setStateStats(stRes);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Projects Data on Parameter Change
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        order: sortOrder
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedSector !== 'All') params.sector = selectedSector;
      if (selectedState !== 'All') params.state = selectedState;
      if (selectedRisk !== 'All') params.risk_category = selectedRisk;

      const res = await getProjects(params);
      setProjectsData(res);
    } catch (err) {
      console.error('Failed to fetch projects registry:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, selectedSector, selectedState, selectedRisk]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Animated Summary Metrics
  const countTotal = useCountUp(summary?.total_projects || projectsData.total || 0);
  const countHighRisk = useCountUp(summary?.high_risk_projects || 0);
  const countOnTrack = useCountUp(summary?.low_risk_projects || 0);
  const avgCostOverrun = useCountUp(summary?.avg_cost_overrun_rate || 0, 1000, 1);

  // Sector and State list options
  const sectorOptions = useMemo(() => {
    const list = sectorStats.map(s => s.sector).filter(Boolean);
    return ['All', ...new Set(list)].sort();
  }, [sectorStats]);

  const stateOptions = useMemo(() => {
    const list = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Jammu & Kashmir', 'Ladakh'
    ];
    return ['All', ...list];
  }, []);

  // Check if any filter is actively applied
  const isFiltered = useMemo(() => {
    return searchQuery !== '' || selectedSector !== 'All' || selectedState !== 'All' || selectedRisk !== 'All';
  }, [searchQuery, selectedSector, selectedState, selectedRisk]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSector('All');
    setSelectedState('All');
    setSelectedRisk('All');
    setSortBy('risk_score');
    setSortOrder('desc');
    setPage(1);
  };

  // CSV Export for filtered projects
  const handleExportCSV = () => {
    if (!projectsData.projects || projectsData.projects.length === 0) return;
    const headers = [
      'Project ID',
      'Project Name',
      'Sector',
      'State',
      'District',
      'Sanctioned Cost (Cr)',
      'Revised Cost (Cr)',
      'Actual Expenditure (Cr)',
      'Physical Progress (%)',
      'Financial Progress (%)',
      'Risk Score',
      'Risk Category',
      'Cost Overrun Prob (%)',
      'Time Overrun Prob (%)',
      'Contractor'
    ];

    const rows = projectsData.projects.map(p => [
      `"${p.project_id}"`,
      `"${(p.project_name || '').replace(/"/g, '""')}"`,
      `"${p.sector || ''}"`,
      `"${p.state || ''}"`,
      `"${p.district || ''}"`,
      p.sanctioned_cost || 0,
      p.revised_cost || 0,
      p.actual_expenditure || 0,
      p.physical_progress || 0,
      p.financial_progress || 0,
      p.risk_score || 0,
      `"${p.risk_category || 'Low'}"`,
      Math.round((p.cost_overrun_probability || 0) * 100),
      Math.round((p.time_overrun_probability || 0) * 100),
      `"${(p.contractor_name || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Infrawatch_Projects_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* 1. CLEAN HEADER STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-nominal text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              NATIONAL ASSET REPOSITORY
            </span>
            <span className="text-xs font-mono text-[#8D8574]">
              {projectsData.total.toLocaleString()} Assets Monitored
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1A] tracking-tight">
            Projects Registry
          </h1>
          <p className="text-xs sm:text-sm text-[#655E4E] mt-0.5">
            Operational status, statutory milestones, and predictive risk indicators across India.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="btn-sovereign-secondary px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer text-[#C25E3E] hover:border-[#C25E3E]"
            >
              <X size={13} />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="btn-sovereign-secondary px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Download visible records as CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-lg border border-[rgba(61,58,52,0.1)]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1E1E1E] text-white shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#1E1E1E] text-white shadow-xs' : 'text-[#655E4E] hover:text-[#1B1C1A]'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. COMPACT EXECUTIVE METRICS STRIP (CLEAN & NON-MESSY) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card p-3.5 rounded-xl border border-[rgba(61,58,52,0.08)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-[#8D8574] block">
              Total Monitored
            </span>
            <div className="text-xl font-mono font-extrabold text-[#1B1C1A] mt-0.5">
              {countTotal.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#655E4E]">Active Assets</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EFECE6] text-[#1E1E1E] flex items-center justify-center shrink-0">
            <Layers size={17} />
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-[rgba(194,94,62,0.18)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-[#C25E3E] block">
              Critical Risk (&ge;65)
            </span>
            <div className="text-xl font-mono font-extrabold text-[#C25E3E] mt-0.5">
              {countHighRisk.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#C25E3E]/80">Intervention Mandate</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[rgba(194,94,62,0.12)] text-[#C25E3E] flex items-center justify-center shrink-0">
            <ShieldAlert size={17} />
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-[rgba(74,93,78,0.18)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-[#4A5D4E] block">
              Nominal &amp; On-Track
            </span>
            <div className="text-xl font-mono font-extrabold text-[#2D3A30] mt-0.5">
              {countOnTrack.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#4A5D4E]/80">Within Standard Drift</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[rgba(74,93,78,0.12)] text-[#4A5D4E] flex items-center justify-center shrink-0">
            <CheckCircle2 size={17} />
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-[rgba(217,119,6,0.18)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-[#D97706] block">
              Sanctioned Capital
            </span>
            <div className="text-xl font-mono font-extrabold text-[#1B1C1A] mt-0.5">
              ₹ {((summary?.total_sanctioned_cost || 0) / 1000).toFixed(1)}k Cr
            </div>
            <span className="text-[10px] text-[#655E4E]">Avg Drift: +{avgCostOverrun}%</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[rgba(217,119,6,0.12)] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingUp size={17} />
          </div>
        </div>
      </div>

      {/* 3. UNIFIED FILTER & SEARCH TOOLBAR (SPACIOUS & STRUCTURED) */}
      <div className="glass-card p-4 rounded-xl border border-[rgba(61,58,52,0.1)] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-3 text-[#8D8574]" />
            <input
              type="text"
              placeholder="Search by project name, ID (e.g. PROJ-706), agency, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#1B1C1A] pl-9 pr-8 py-2.5 rounded-lg focus:outline-none focus:border-[#1E1E1E] transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#8D8574] hover:text-[#1B1C1A] p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sector Selector */}
          <div className="w-full lg:w-48">
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#1B1C1A] px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#1E1E1E] font-medium transition-colors"
            >
              <option value="All">All Sectors ({sectorOptions.length - 1})</option>
              {sectorOptions.filter(s => s !== 'All').map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* State Selector */}
          <div className="w-full lg:w-44">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#1B1C1A] px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#1E1E1E] font-medium transition-colors"
            >
              <option value="All">All States ({stateOptions.length - 1})</option>
              {stateOptions.filter(s => s !== 'All').map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="w-full lg:w-48">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full bg-[#FAF9F5] border border-[rgba(61,58,52,0.14)] text-xs text-[#1B1C1A] px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#1E1E1E] font-medium transition-colors"
            >
              <option value="risk_score-desc">Sort: Highest Risk First</option>
              <option value="risk_score-asc">Sort: Lowest Risk First</option>
              <option value="sanctioned_cost-desc">Sort: Sanctioned Cost (High)</option>
              <option value="sanctioned_cost-asc">Sort: Sanctioned Cost (Low)</option>
              <option value="actual_expenditure-desc">Sort: Expenditure (High)</option>
              <option value="physical_progress-desc">Sort: Physical Progress (High)</option>
              <option value="project_name-asc">Sort: Name (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Risk Category Tabs & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[rgba(61,58,52,0.06)] text-xs">
          {/* Risk Level Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#8D8574] mr-1">Risk Filter:</span>
            {[
              { id: 'All', label: 'All Projects' },
              { id: 'High', label: 'Critical' },
              { id: 'Medium', label: 'Moderate' },
              { id: 'Low', label: 'Nominal' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedRisk(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full font-mono text-[11px] transition-all cursor-pointer ${
                  selectedRisk === tab.id
                    ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
                    : 'bg-[#EFECE6] text-[#655E4E] hover:text-[#1B1C1A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results Counter & Items per page */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#655E4E]">
            <span>
              Showing {projectsData.projects.length ? ((page - 1) * pageSize) + 1 : 0}–{Math.min(page * pageSize, projectsData.total)} of {projectsData.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#FAF9F5] border border-[rgba(61,58,52,0.12)] rounded px-1.5 py-0.5 text-[11px] font-mono"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT (CLEAN TABLE VIEW OR CARD GRID VIEW) */}
      {loading ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#1E1E1E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#655E4E]">Querying national infrastructure database...</p>
        </div>
      ) : projectsData.projects.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center space-y-3">
          <AlertTriangle size={32} className="text-[#D97706] mx-auto opacity-75" />
          <h3 className="font-serif font-bold text-base text-[#1B1C1A]">No Matching Infrastructure Assets Found</h3>
          <p className="text-xs text-[#655E4E] max-w-md mx-auto">
            No projects matched your active search query or filter parameters. Try broadening your keywords or clearing active filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-sovereign-primary px-4 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 mt-2"
          >
            <RefreshCw size={12} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW (CLEAN, AIRY, HIGH CONTRAST) */
        <div className="glass-card rounded-2xl overflow-hidden border border-[rgba(61,58,52,0.1)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#8D8574] uppercase font-mono font-bold text-[10px] tracking-wider border-b border-[rgba(61,58,52,0.1)]">
                <tr>
                  <th className="py-3 px-4">Project ID &amp; Name</th>
                  <th className="py-3 px-4">Sector &amp; Location</th>
                  <th className="py-3 px-4">Sanctioned &amp; Spend</th>
                  <th className="py-3 px-4">Progress (Phy / Fin)</th>
                  <th className="py-3 px-4 text-center">Risk Index</th>
                  <th className="py-3 px-4">Overrun Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(61,58,52,0.06)] bg-[#FAF9F5]">
                {projectsData.projects.map((proj) => {
                  const costProb = Math.round((proj.cost_overrun_probability || 0.15) * 100);
                  const timeProb = Math.round((proj.time_overrun_probability || 0.20) * 100);
                  const expPct = Math.min(100, Math.round(((proj.actual_expenditure || 0) / (proj.sanctioned_cost || 1)) * 100));

                  return (
                    <tr 
                      key={proj.project_id} 
                      className="hover:bg-[#EFECE6]/40 transition-colors group"
                    >
                      {/* 1. Name & ID */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <Link 
                          to={`/projects/${proj.project_id}`}
                          className="font-bold text-[#1B1C1A] hover:text-[#D97706] line-clamp-1 block transition-colors"
                          title={proj.project_name}
                        >
                          {proj.project_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-[#8D8574]">
                          <span className="font-semibold text-[#1B1C1A] bg-[#EFECE6] px-1.5 py-0.2 rounded">
                            {proj.project_id}
                          </span>
                          {proj.implementing_agency && (
                            <span className="truncate max-w-[120px]" title={proj.implementing_agency}>
                              {proj.implementing_agency}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Sector & Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-[#1B1C1A] block">
                          {proj.sector}
                        </span>
                        <span className="text-[10px] text-[#8D8574] flex items-center gap-1 mt-0.5 font-mono">
                          <MapPin size={10} className="text-[#D97706]" />
                          <span>{proj.state}{proj.district ? ` (${proj.district})` : ''}</span>
                        </span>
                      </td>

                      {/* 3. Sanctioned & Expenditure */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-[#1B1C1A] text-xs">
                          ₹ {(proj.sanctioned_cost || 0).toLocaleString()} Cr
                        </div>
                        <div className="text-[10px] text-[#655E4E] flex items-center gap-1.5 mt-0.5">
                          <span>₹ {(proj.actual_expenditure || 0).toLocaleString()} Cr</span>
                          <span className="text-[#8D8574]">({expPct}%)</span>
                        </div>
                      </td>

                      {/* 4. Progress Bars */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[10px] min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#8D8574]">Physical:</span>
                            <strong className="text-[#4A5D4E]">{proj.physical_progress || 0}%</strong>
                          </div>
                          <div className="w-full h-1 bg-[#EFECE6] rounded-full overflow-hidden">
                            <div className="bg-[#4A5D4E] h-full" style={{ width: `${proj.physical_progress || 0}%` }} />
                          </div>

                          <div className="flex justify-between pt-0.5">
                            <span className="text-[#8D8574]">Financial:</span>
                            <strong className="text-[#D97706]">{proj.financial_progress || 0}%</strong>
                          </div>
                          <div className="w-full h-1 bg-[#EFECE6] rounded-full overflow-hidden">
                            <div className="bg-[#D97706] h-full" style={{ width: `${proj.financial_progress || 0}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* 5. Risk Score Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                          proj.risk_score >= 65 
                            ? 'bg-[rgba(194,94,62,0.14)] text-[#C25E3E] border border-[rgba(194,94,62,0.25)]' 
                            : proj.risk_score >= 35 
                            ? 'bg-[rgba(217,119,6,0.14)] text-[#D97706] border border-[rgba(217,119,6,0.25)]' 
                            : 'bg-[rgba(74,93,78,0.14)] text-[#4A5D4E] border border-[rgba(74,93,78,0.25)]'
                        }`}>
                          {proj.risk_score} / 100
                        </span>
                      </td>

                      {/* 6. Overrun Risk Chips */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[10px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#8D8574]">Cost Overrun:</span>
                            <span className={`font-semibold ${costProb >= 50 ? 'text-[#C25E3E]' : 'text-[#655E4E]'}`}>
                              {costProb}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#8D8574]">Schedule Delay:</span>
                            <span className={`font-semibold ${timeProb >= 50 ? 'text-[#D97706]' : 'text-[#655E4E]'}`}>
                              {timeProb}%
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Action Links */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/projects/${proj.project_id}`}
                            className="btn-sovereign-secondary px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
                            title="Open detailed telemetry &amp; prescriptions"
                          >
                            <span>Inspect</span>
                            <ExternalLink size={11} />
                          </Link>
                          <Link
                            to="/drivers"
                            className="p-1 text-[#8D8574] hover:text-[#D97706] rounded transition-colors"
                            title="Test counterfactuals in What-If Simulator"
                          >
                            <Sliders size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* GRID / CARD VIEW (EXECUTIVE TILES) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsData.projects.map((proj) => {
            const costProb = Math.round((proj.cost_overrun_probability || 0.15) * 100);
            const timeProb = Math.round((proj.time_overrun_probability || 0.20) * 100);

            return (
              <div
                key={proj.project_id}
                className="glass-card p-4 rounded-xl border border-[rgba(61,58,52,0.1)] hover:border-[#1E1E1E] transition-all flex flex-col justify-between space-y-3.5 group shadow-2xs"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EFECE6] text-[#655E4E]">
                      {proj.sector}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      proj.risk_score >= 65 ? 'badge-sienna' :
                      proj.risk_score >= 35 ? 'badge-amber' :
                      'badge-nominal'
                    }`}>
                      Risk {proj.risk_score}/100
                    </span>
                  </div>

                  <Link 
                    to={`/projects/${proj.project_id}`}
                    className="font-serif font-bold text-sm text-[#1B1C1A] hover:text-[#D97706] line-clamp-2 leading-snug group-hover:underline"
                  >
                    {proj.project_name}
                  </Link>
                  
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8D8574] mt-1.5">
                    <span>ID: {proj.project_id}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} className="text-[#D97706]" />
                      {proj.state}
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2 pt-1 font-mono text-xs border-t border-[rgba(61,58,52,0.06)]">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8D8574]">Physical Progress</span>
                      <strong className="text-[#4A5D4E]">{proj.physical_progress || 0}%</strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                      <div className="bg-[#4A5D4E] h-full" style={{ width: `${proj.physical_progress || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8D8574]">Financial Progress</span>
                      <strong className="text-[#D97706]">{proj.financial_progress || 0}%</strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden">
                      <div className="bg-[#D97706] h-full" style={{ width: `${proj.financial_progress || 0}%` }} />
                    </div>
                  </div>
                </div>

                {/* Key Numbers Strip */}
                <div className="grid grid-cols-2 gap-2 bg-[#FAF9F5] p-2.5 rounded-lg border border-[rgba(61,58,52,0.06)] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[#8D8574] block">Sanctioned:</span>
                    <span className="font-bold text-[#1B1C1A]">₹ {(proj.sanctioned_cost || 0).toLocaleString()} Cr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D8574] block">Actual Spend:</span>
                    <span className="font-bold text-[#655E4E]">₹ {(proj.actual_expenditure || 0).toLocaleString()} Cr</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[rgba(61,58,52,0.06)]">
                  <span className="text-[10px] font-mono text-[#8D8574]">
                    Overrun: Cost {costProb}% | Time {timeProb}%
                  </span>
                  <Link
                    to={`/projects/${proj.project_id}`}
                    className="btn-sovereign-primary px-3 py-1 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CLEAN PAGINATION CONTROLS */}
      {projectsData.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 font-mono text-xs">
          <div className="text-[#8D8574]">
            Page <strong>{projectsData.page}</strong> of <strong>{projectsData.total_pages}</strong> ({projectsData.total.toLocaleString()} assets total)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="btn-sovereign-secondary p-1.5 rounded-lg disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Quick Page Number Chips */}
            {Array.from({ length: Math.min(5, projectsData.total_pages) }, (_, idx) => {
              let pageNum = page;
              if (projectsData.total_pages <= 5) {
                pageNum = idx + 1;
              } else if (page <= 3) {
                pageNum = idx + 1;
              } else if (page >= projectsData.total_pages - 2) {
                pageNum = projectsData.total_pages - 4 + idx;
              } else {
                pageNum = page - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                    page === pageNum
                      ? 'bg-[#1E1E1E] text-white font-bold shadow-xs'
                      : 'bg-[#FAF9F5] border border-[rgba(61,58,52,0.12)] text-[#655E4E] hover:border-[#1E1E1E]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(projectsData.total_pages, p + 1))}
              disabled={page >= projectsData.total_pages || loading}
              className="btn-sovereign-secondary p-1.5 rounded-lg disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
