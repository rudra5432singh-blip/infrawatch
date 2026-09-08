import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/shared/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Assistant from './pages/Assistant';
import Alerts from './pages/Alerts';
import Benchmarks from './pages/Benchmarks';
import CostDrivers from './pages/CostDrivers';
import ProjectsMap from './pages/ProjectsMap';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<ProjectsMap />} />
          <Route path="projects" element={<Dashboard />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="benchmarks" element={<Benchmarks />} />
          <Route path="drivers" element={<CostDrivers />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
