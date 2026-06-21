import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Tv, Download, ExternalLink, Code } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons';

import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. LIGHTWEIGHT STATE ROUTER
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  // Pull your Render API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || '';

  // Listen for hash changes in the URL (e.g. going to http://localhost:5173/#/admin)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Fetch project dynamic cards from your Flask API
    fetch(`${API_URL}/api/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        setLoading(false);
      });
  }, [API_URL]);

  // 2. ROUTE CONDITIONAL RENDERING
  if (currentPath === '#/admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="relative overflow-hidden border-b border-gray-800/80 bg-gradient-to-b from-slate-950 via-gray-900 to-gray-900 py-20 px-4">
        {/* Background Decorative Mesh Glows */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            {/* Live API Telemetry Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6 tracking-wide backdrop-blur-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              API ENGINE: OPERATIONAL
            </div>

            {/* Gradient Text Header */}
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
              Patrick R. <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400">Grady</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mt-3 font-semibold tracking-wide">
              Software Engineer <span className="text-emerald-500/40 font-light">|</span> AI Integration Specialist
            </p>

            {/* Structured Professional & Personality Bio */}
            <p className="text-gray-400 mt-6 leading-relaxed text-base md:text-lg max-w-xl">
              Building dynamic full-stack infrastructure and highly optimized mobile applications. 
              Focused on algorithmic structural execution and intelligent workflows. 
            </p>
            
            <p className="text-gray-400 mt-3 leading-relaxed text-base md:text-lg max-w-xl">
              When the compiler rests, I reverse-engineer retro game architecture—analyzing routing logic, 
              seed pacing, and combat mechanics for <span className="text-amber-400 font-medium">Zelda 1</span> and <span className="text-amber-400 font-medium">Super Mario Bros. 3</span> Randomizers.
            </p>

            {/* Modern Social Action Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
              <a href="https://github.com/patgrady64" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-600 shadow-md transition-all duration-200">
                <FontAwesomeIcon icon={faGithub} className="text-lg" /> GitHub Profile
              </a>
              <a href="https://www.linkedin.com/in/patgrady64/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200">
                <FontAwesomeIcon icon={faLinkedin} className="text-lg text-blue-400" /> LinkedIn Network
              </a>
              <a href="https://www.youtube.com/@iminvisibl2u" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 font-medium text-sm px-4 py-2.5 rounded-xl border border-red-900/30 hover:border-red-700/50 transition-all duration-200">
                <FontAwesomeIcon icon={faYoutube} className="text-lg" /> YouTube Channel
              </a>
            </div>
          </div>

          {/* Interactive Side Overview Dashboard */}
          <div className="w-full md:w-80 bg-gray-950/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl self-start md:self-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 flex items-center justify-between">
              <span>Environment Profile</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">v1.0.0</span>
            </h3>
            <ul className="space-y-3 font-mono text-xs">
              <li className="flex justify-between"><span className="text-gray-500">Focus:</span> <span className="text-emerald-400">AI & Software Eng.</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Frameworks:</span> <span className="text-slate-300">React, Flask, Supabase</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Languages:</span> <span className="text-slate-300">Python, Kotlin</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Routing Target:</span> <span className="text-amber-400">Z1R / SMB3R</span></li>
              {/* Secret Admin Shortcut Entry Point */}
              <li className="flex justify-between pt-2 border-t border-gray-800/60">
                <span className="text-gray-600">Console Pipeline:</span> 
                <a href="#/admin" className="text-gray-500 hover:text-emerald-400 transition-colors duration-150">Open Admin →</a>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main Content Layout Container */}
      <main className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        
        {/* SECTION 1: SOFTWARE PORTFOLIO */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-10 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <Code className="text-emerald-400 stroke-[2.5]" size={22} /> Production Software Projects
              </h2>
              <p className="text-sm text-gray-500 mt-1">Dynamic applications synced directly via Supabase & Flask API architecture</p>
            </div>
            <div className="text-xs text-gray-400 font-mono bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800 self-start sm:self-auto">
              Status: Connected
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-950/20 border border-gray-800/60 rounded-2xl border-dashed">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 mt-4 font-mono">Querying cloud environment payload tables...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="group relative bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800 hover:border-emerald-500/30 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/10 flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle hover background accent glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
                        {project.title}
                      </h3>
                      <span className="text-[10px] font-mono tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 uppercase">
                        Active Build
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mt-3 leading-relaxed font-normal">
                      {project.description}
                    </p>

                    {/* Tech Stack Badges */}
                    <div className="flex flex-wrap gap-2 mt-5">
                      {project.tech_stack.map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="font-mono text-[11px] font-medium text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10 shadow-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Media Preview & Call-to-Action Bar */}
                  <div className="mt-8 pt-5 border-t border-gray-800/60 flex items-center justify-between gap-4">
                    {project.gif_url ? (
                      <div className="relative group/thumb w-14 h-14 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 shadow-inner flex-shrink-0">
                        <img src={project.gif_url} alt="App Walkthrough Preview" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-950 border border-gray-800/80 flex flex-col items-center justify-center text-[10px] font-mono text-gray-600 flex-shrink-0 select-none">
                        <span>NO</span>
                        <span>MOCK</span>
                        <span>MOCK</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <a 
                        href={project.live_url || "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 font-mono text-xs text-gray-400 hover:text-white bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 px-3 py-2 rounded-xl transition-all duration-200"
                      >
                        Code <ExternalLink size={13} className="text-gray-500" />
                      </a>
                      {project.download_url && (
                        <a 
                          href={project.download_url} 
                          className="flex items-center gap-1.5 font-sans font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/50 px-3.5 py-2 rounded-xl transition-all duration-200"
                        >
                          <Download size={13} /> Download Build
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: STREAMING & CONTENT HUB */}
        <section>
          <div className="mb-10 border-b border-gray-800 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Tv className="text-purple-400 stroke-[2.5]" size={22} /> Media & Structural Analysis Hub
            </h2>
            <p className="text-sm text-gray-500 mt-1">Video captures, algorithmic run optimization, and live broadcast logs</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Primary Video Container */}
            <div className="lg:col-span-2 bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <FontAwesomeIcon icon={faYoutube} className="text-red-500 text-base" /> LATEST MODULE WALKTHROUGH
                </h3>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </div>
              {/* Premium Aspect Ratio Player Shell */}
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-900 shadow-inner group relative">
                <ReactPlayer 
                  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                  width="100%" 
                  height="100%" 
                  controls 
                  config={{ youtube: { playerVars: { modestbranding: 1 } } }}
                />
              </div>
            </div>

            {/* Broadcast Details Sidebar Card */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <Tv className="text-purple-400" size={16} /> BROADCAST SPECIFICATIONS
                </h3>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  Gameplay capture sequences run on a localized, silent system environment. Broadcast audio records core execution routing, tracking optimization paths and live speed metrics cleanly.
                </p>
              </div>

              {/* Status Indicator Box */}
              <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Audio Mode:</span>
                  <span className="text-slate-300 font-medium">Game Only / Silent Feed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Telemetry Target:</span>
                  <span className="text-amber-400 font-medium">Z1R Seed / SMB3R</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Output Stream:</span>
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Offline
                  </span>
                </div>
              </div>

              <a 
                href="https://www.twitch.tv/iminvizibl2u" 
                target="_blank" 
                rel="noreferrer" 
                className="block w-full text-center bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white font-semibold text-sm py-3 rounded-xl border border-purple-500/20 hover:border-purple-500 shadow-md transition-all duration-200"
              >
                Access Broadcast Feed
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;