import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Building2, 
  X, 
  ChevronRight, 
  Maximize2, 
  Compass, 
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProjects } from '../utils/api';
import { getProjectCoordinates, STATE_COORDINATES } from '../utils/geoCoordinates';

const REGION_BOUNDS = {
  'All India': { center: [22.9734, 78.6569], zoom: 5 },
  'Northern': { center: [30.5, 77.0], zoom: 6 },
  'Western': { center: [21.5, 72.8], zoom: 6 },
  'Southern': { center: [13.0, 77.5], zoom: 6 },
  'Eastern': { center: [23.5, 87.5], zoom: 6 },
  'Central': { center: [23.5, 80.0], zoom: 6 },
};

// 100% Free, Open-Source Tile Providers (Zero API Key required)
const FREE_MAP_THEMES = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap (Standard)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19
  },
  humanitarian: {
    id: 'humanitarian',
    name: 'Warm Terrain (HOT OSM)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19
  },
  topo: {
    id: 'topo',
    name: 'Topographic Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap, &copy; OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17
  }
};

export default function ProjectsMap() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Free Map Theme State
  const [mapTheme, setMapTheme] = useState('osm');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [activeRegion, setActiveRegion] = useState('All India');

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Fetch all projects for geospatial surveillance
  const fetchAllProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects({ page: 1, page_size: 2000 });
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load project geospatial coordinates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  // Compute unique lists for filter dropdowns
  const sectors = useMemo(() => {
    const set = new Set(projects.map(p => p.sector).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [projects]);

  const states = useMemo(() => {
    const set = new Set(projects.map(p => p.state).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [projects]);

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedState !== 'All' && p.state !== selectedState) return false;
      if (selectedSector !== 'All' && p.sector !== selectedSector) return false;
      if (selectedRisk !== 'All' && p.risk_category !== selectedRisk) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = p.project_name?.toLowerCase().includes(q);
        const matchCode = p.project_id?.toLowerCase().includes(q);
        const matchAgency = p.implementing_agency?.toLowerCase().includes(q);
        const matchDist = p.district?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAgency && !matchDist) return false;
      }
      return true;
    });
  }, [projects, selectedState, selectedSector, selectedRisk, searchTerm]);

  // Aggregate HUD Stats
  const hudStats = useMemo(() => {
    const total = filteredProjects.length;
    const highRisk = filteredProjects.filter(p => p.risk_category === 'High').length;
    const totalCost = filteredProjects.reduce((acc, p) => acc + (p.revised_cost || p.sanctioned_cost || 0), 0);
    const avgOverrun = total > 0 
      ? (filteredProjects.reduce((acc, p) => acc + (p.cost_overrun_pct || 0), 0) / total).toFixed(1)
      : 0;

    return { total, highRisk, totalCost, avgOverrun };
  }, [filteredProjects]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.9734, 78.6569],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: [[4.0, 65.0], [38.5, 100.0]],
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false
    });

    // 100% Free OpenStreetMap Tile Layer (Zero API key required)
    const initialTheme = FREE_MAP_THEMES.osm;
    const tileLayer = L.tileLayer(initialTheme.url, {
      attribution: initialTheme.attribution,
      subdomains: initialTheme.subdomains,
      maxZoom: initialTheme.maxZoom
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Free Map Tile Provider smoothly without re-rendering markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const theme = FREE_MAP_THEMES[mapTheme] || FREE_MAP_THEMES.osm;
    const layer = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      subdomains: theme.subdomains || ['a', 'b', 'c'],
      maxZoom: theme.maxZoom
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = layer;
  }, [mapTheme]);

  // Update Markers when filtered projects change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    filteredProjects.forEach(project => {
      const [lat, lng] = getProjectCoordinates(project);
      const isHigh = project.risk_category === 'High';
      const isMedium = project.risk_category === 'Medium';

      // Custom HTML Pin with Sovereign Editorial Colors
      let pinColor = '#4A5D4E'; // Nominal Lichen
      let pulseHtml = '';

      if (isHigh) {
        pinColor = '#C25E3E'; // Sienna Alert
        pulseHtml = `<span class="map-radar-pulse" style="background-color: rgba(194, 94, 62, 0.45); border: 1px solid rgba(194, 94, 62, 0.7);"></span>`;
      } else if (isMedium) {
        pinColor = '#D97706'; // Warm Amber
        pulseHtml = `<span class="map-radar-pulse" style="background-color: rgba(217, 119, 6, 0.4); border: 1px solid rgba(217, 119, 6, 0.6);"></span>`;
      }

      const customIcon = L.divIcon({
        className: 'map-radar-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        html: `
          <div class="pin-inner">
            ${pulseHtml}
            <div style="background-color: ${pinColor}; width: 11px; height: 11px; border-radius: 50%; border: 2px solid #FAF9F5; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" />
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Clean Editorial Frosted Popup
      const popupHtml = `
        <div style="padding: 14px 16px; min-width: 220px; max-width: 280px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #8D8574; text-transform: uppercase;">
              ${project.project_id || 'ASSET'}
            </span>
            <span style="
              font-size: 10px; 
              font-weight: 700; 
              padding: 2px 8px; 
              border-radius: 9999px; 
              background-color: ${isHigh ? 'rgba(194, 94, 62, 0.12)' : isMedium ? 'rgba(217, 119, 6, 0.12)' : 'rgba(74, 93, 78, 0.12)'};
              color: ${isHigh ? '#C25E3E' : isMedium ? '#D97706' : '#2D3A30'};
              border: 1px solid ${isHigh ? 'rgba(194, 94, 62, 0.3)' : isMedium ? 'rgba(217, 119, 6, 0.3)' : 'rgba(74, 93, 78, 0.3)'};
            ">
              ${project.risk_category || 'Low'} Risk
            </span>
          </div>
          <h4 style="font-family: 'Newsreader', Georgia, serif; font-size: 14px; font-weight: 700; line-height: 1.3; color: #1B1C1A; margin: 0 0 4px 0;">
            ${project.project_name}
          </h4>
          <div style="font-size: 11px; color: #655E4E; margin-bottom: 10px;">
            ${project.district ? `${project.district}, ` : ''}${project.state || 'National'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 8px; background-color: #FAF9F5; border-radius: 8px; border: 1px solid rgba(61, 58, 52, 0.08); margin-bottom: 10px; font-size: 11px;">
            <div>
              <div style="color: #8D8574; font-size: 9px; text-transform: uppercase;">Delay</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${project.delay_months > 0 ? '#C25E3E' : '#2D3A30'};">
                ${project.delay_months || 0} Mo
              </div>
            </div>
            <div>
              <div style="color: #8D8574; font-size: 9px; text-transform: uppercase;">Cost Overrun</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${project.cost_overrun_pct > 0 ? '#D97706' : '#2D3A30'};">
                ${project.cost_overrun_pct ? `+${project.cost_overrun_pct}%` : '0%'}
              </div>
            </div>
          </div>
          <a href="/projects/${project.project_id}" style="display: block; width: 100%; text-align: center; background-color: #1E1E1E; color: #FAF9F5; font-size: 11px; font-weight: 600; padding: 6px 0; border-radius: 9999px; text-decoration: none; transition: background 0.2s;">
            Inspect Asset Deeply &rarr;
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedProject(project);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredProjects]);

  // Jump to region
  const handleRegionChange = (regionName) => {
    setActiveRegion(regionName);
    const target = REGION_BOUNDS[regionName];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(target.center, target.zoom, { duration: 1.2 });
    }
  };

  // Jump when state filter changes
  useEffect(() => {
    if (selectedState !== 'All' && STATE_COORDINATES[selectedState] && mapInstanceRef.current) {
      const coords = STATE_COORDINATES[selectedState];
      mapInstanceRef.current.flyTo(coords, 7, { duration: 1 });
    }
  }, [selectedState]);

  return (
    <div className="relative w-full h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6rem)] -m-3.5 sm:-m-6 md:-m-8 overflow-hidden flex flex-col bg-[#FAF9F5]">
      
      {/* 1. FLOATING SOVEREIGN INTELLIGENCE CONTROLS (TOP BAR) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Search & Filter Capsule */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-[#FAF9F5]/92 backdrop-blur-xl border border-[rgba(61,58,52,0.14)] p-2 rounded-2xl sm:rounded-full shadow-[0_12px_32px_rgba(61,58,52,0.12)]">
          {/* Search */}
          <div className="relative flex items-center min-w-[170px] sm:min-w-[210px]">
            <Search size={14} className="absolute left-3 text-[#8D8574]" />
            <input 
              type="text" 
              placeholder="Search asset, district, agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-transparent rounded-full focus:outline-none placeholder-[#8D8574] text-[#1B1C1A]"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="pr-2 text-[#8D8574] hover:text-[#1B1C1A]">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-[rgba(61,58,52,0.15)] hidden sm:block" />

          {/* State Selector */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs bg-transparent text-[#3D3A34] font-medium py-1 px-2.5 rounded-full border border-transparent hover:border-[rgba(61,58,52,0.12)] focus:outline-none cursor-pointer"
          >
            <option value="All">All States ({states.length - 1})</option>
            {states.filter(s => s !== 'All').map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Sector Selector */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs bg-transparent text-[#3D3A34] font-medium py-1 px-2.5 rounded-full border border-transparent hover:border-[rgba(61,58,52,0.12)] focus:outline-none cursor-pointer hidden md:block max-w-[130px] truncate"
          >
            <option value="All">All Sectors</option>
            {sectors.filter(s => s !== 'All').map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <div className="h-4 w-px bg-[rgba(61,58,52,0.15)] hidden md:block" />

          {/* Risk Level Pills */}
          <div className="flex items-center gap-1">
            {['All', 'High', 'Medium', 'Low'].map(risk => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${
                  selectedRisk === risk
                    ? risk === 'High' 
                      ? 'bg-[#C25E3E] text-white shadow-sm'
                      : risk === 'Medium'
                      ? 'bg-[#D97706] text-white shadow-sm'
                      : risk === 'Low'
                      ? 'bg-[#4A5D4E] text-white shadow-sm'
                      : 'bg-[#1E1E1E] text-white shadow-sm'
                    : 'text-[#655E4E] hover:bg-[#EFECE6]'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[rgba(61,58,52,0.15)] hidden lg:block" />

          {/* Free Map Style Selector */}
          <div className="hidden lg:flex items-center gap-1">
            <Layers size={12} className="text-[#8D8574] ml-1" />
            <select
              value={mapTheme}
              onChange={(e) => setMapTheme(e.target.value)}
              className="text-[11px] font-mono bg-transparent text-[#2D3A30] font-semibold py-1 px-2 rounded-full border border-transparent hover:border-[rgba(61,58,52,0.12)] focus:outline-none cursor-pointer"
            >
              <option value="osm">OSM Standard (Free)</option>
              <option value="humanitarian">Warm Terrain (Free)</option>
              <option value="topo">Topographic Relief (Free)</option>
            </select>
          </div>
        </div>

        {/* Right Regional Quick-Focus Strip */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#FAF9F5]/92 backdrop-blur-xl border border-[rgba(61,58,52,0.14)] p-1.5 rounded-full shadow-[0_12px_32px_rgba(61,58,52,0.12)] overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-[#8D8574] px-2 flex items-center gap-1 shrink-0">
            <Compass size={12} className="text-[#D97706]" />
            Region:
          </span>
          {Object.keys(REGION_BOUNDS).map(region => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all shrink-0 ${
                activeRegion === region 
                  ? 'bg-[#1E1E1E] text-[#FAF9F5]' 
                  : 'text-[#655E4E] hover:text-[#1B1C1A] hover:bg-[#EFECE6]'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LIVE SURVEILLANCE HUD BAR (BOTTOM LEFT) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto bg-[#FAF9F5]/94 backdrop-blur-xl border border-[rgba(61,58,52,0.14)] p-3.5 rounded-2xl shadow-[0_16px_36px_rgba(61,58,52,0.14)] flex flex-wrap items-center gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#8D8574] tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A5D4E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4A5D4E]"></span>
            </span>
            Geospatial Assets
          </div>
          <div className="font-serif font-bold text-lg text-[#1B1C1A]">
            {hudStats.total.toLocaleString('en-IN')} <span className="text-xs font-sans text-[#8D8574] font-normal">Active</span>
          </div>
        </div>

        <div className="h-7 w-px bg-[rgba(61,58,52,0.12)]" />

        <div>
          <div className="text-[10px] uppercase font-mono text-[#C25E3E] tracking-wider flex items-center gap-1 font-semibold">
            <ShieldAlert size={11} />
            Severe Drift
          </div>
          <div className="font-serif font-bold text-lg text-[#C25E3E]">
            {hudStats.highRisk} <span className="text-xs font-sans text-[#8D8574] font-normal">Projects</span>
          </div>
        </div>

        <div className="h-7 w-px bg-[rgba(61,58,52,0.12)] hidden sm:block" />

        <div className="hidden sm:block">
          <div className="text-[10px] uppercase font-mono text-[#8D8574] tracking-wider">
            Monitored Capital
          </div>
          <div className="font-serif font-bold text-lg text-[#1B1C1A]">
            ₹ {Math.round(hudStats.totalCost).toLocaleString('en-IN')} <span className="text-xs font-sans text-[#8D8574] font-normal">Cr</span>
          </div>
        </div>

        <div className="h-7 w-px bg-[rgba(61,58,52,0.12)] hidden md:block" />

        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-[#2D3A30] bg-[rgba(74,93,78,0.1)] border border-[rgba(74,93,78,0.22)] px-2.5 py-1 rounded-full font-bold">
          <CheckCircle size={11} className="text-[#4A5D4E]" />
          <span>100% Free OpenStreetMap &bull; No API Key</span>
        </div>

        <button 
          onClick={fetchAllProjects}
          title="Refresh Geospatial Feed"
          className="p-2 rounded-full text-[#8D8574] hover:text-[#1B1C1A] hover:bg-[#EFECE6] transition-colors ml-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 3. LEAFLET MAP CANVAS */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10 outline-none"
        style={{ background: '#FAF9F5' }}
      />

      {/* 4. LOADING STATE OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#FAF9F5]/70 backdrop-blur-md">
          <div className="glass-card p-6 rounded-3xl flex flex-col items-center gap-3 shadow-xl">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#D97706]/30 border-t-[#D97706] animate-spin" />
              <MapPin size={16} className="absolute text-[#D97706]" />
            </div>
            <div className="text-center">
              <p className="font-serif font-bold text-base text-[#1B1C1A]">Loading National Infrastructure Map...</p>
              <p className="text-xs text-[#8D8574] font-mono">Calibrating geospatial coordinates for 1,775 assets via OpenStreetMap</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. SLIDE-OVER PROJECT INSPECTOR DRAWER */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-20 right-4 sm:right-6 z-30 w-[calc(100%-2rem)] sm:w-96 max-h-[calc(100vh-12rem)] overflow-y-auto bg-[#FAF9F5]/95 backdrop-blur-2xl border border-[rgba(61,58,52,0.16)] rounded-3xl p-5 shadow-[0_24px_48px_-12px_rgba(61,58,52,0.22)] flex flex-col gap-4"
          >
            {/* Header with Project ID and Close */}
            <div className="flex items-center justify-between border-b border-[rgba(61,58,52,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#8D8574] tracking-wider">
                  {selectedProject.project_id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  selectedProject.risk_category === 'High' 
                    ? 'badge-sienna' 
                    : selectedProject.risk_category === 'Medium' 
                    ? 'badge-amber' 
                    : 'badge-nominal'
                }`}>
                  {selectedProject.risk_category} Risk
                </span>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-full text-[#8D8574] hover:text-[#1B1C1A] hover:bg-[#EFECE6] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Location */}
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1B1C1A] leading-snug">
                {selectedProject.project_name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-[#655E4E] mt-1.5 font-medium">
                <MapPin size={13} className="text-[#D97706] shrink-0" />
                <span>
                  {selectedProject.district ? `${selectedProject.district}, ` : ''}{selectedProject.state}
                </span>
              </div>
            </div>

            {/* Implementing Agency & Sector */}
            <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[rgba(61,58,52,0.08)] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8D8574]">Implementing Agency</span>
                <span className="font-semibold text-[#1B1C1A] text-right truncate max-w-[180px]">
                  {selectedProject.implementing_agency || 'MoSPI Agency'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8D8574]">Sector</span>
                <span className="font-medium text-[#3D3A34]">
                  {selectedProject.sector}
                </span>
              </div>
            </div>

            {/* Critical Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[rgba(239,236,230,0.6)] border border-[rgba(61,58,52,0.08)]">
                <div className="text-[10px] uppercase font-mono text-[#8D8574]">Schedule Slippage</div>
                <div className="font-mono font-bold text-lg mt-0.5 text-[#C25E3E]">
                  {selectedProject.delay_months || 0} <span className="text-xs font-sans text-[#655E4E] font-normal">Months</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[rgba(239,236,230,0.6)] border border-[rgba(61,58,52,0.08)]">
                <div className="text-[10px] uppercase font-mono text-[#8D8574]">Cost Inflation</div>
                <div className="font-mono font-bold text-lg mt-0.5 text-[#D97706]">
                  {selectedProject.cost_overrun_pct ? `+${selectedProject.cost_overrun_pct}%` : '0%'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[rgba(239,236,230,0.6)] border border-[rgba(61,58,52,0.08)]">
                <div className="text-[10px] uppercase font-mono text-[#8D8574]">Sanctioned Cost</div>
                <div className="font-mono font-bold text-base mt-0.5 text-[#1B1C1A]">
                  ₹ {(selectedProject.sanctioned_cost || 0).toLocaleString('en-IN')} <span className="text-xs font-sans text-[#8D8574]">Cr</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[rgba(239,236,230,0.6)] border border-[rgba(61,58,52,0.08)]">
                <div className="text-[10px] uppercase font-mono text-[#8D8574]">Revised Cost</div>
                <div className="font-mono font-bold text-base mt-0.5 text-[#1B1C1A]">
                  ₹ {(selectedProject.revised_cost || selectedProject.sanctioned_cost || 0).toLocaleString('en-IN')} <span className="text-xs font-sans text-[#8D8574]">Cr</span>
                </div>
              </div>
            </div>

            {/* Physical Progress */}
            {selectedProject.physical_progress_pct !== undefined && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#655E4E] font-medium">Physical Progress</span>
                  <span className="font-mono font-bold text-[#1B1C1A]">{selectedProject.physical_progress_pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1E1E1E] rounded-full transition-all duration-500" 
                    style={{ width: `${selectedProject.physical_progress_pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Link */}
            <Link
              to={`/projects/${selectedProject.project_id}`}
              className="mt-2 w-full py-2.5 px-4 bg-[#1E1E1E] text-[#FAF9F5] rounded-full text-xs font-semibold hover:bg-[#141414] transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(30,30,30,0.2)]"
            >
              <span>Inspect Deep Surveillance Intelligence</span>
              <ArrowUpRight size={14} className="text-[#D97706]" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
