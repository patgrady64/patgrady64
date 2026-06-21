import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Tv, Download, ExternalLink, Code } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pull your Render API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || '';

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
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-600 shadow-md transition-all duration-200">
                <FontAwesomeIcon icon={faGithub} className="text-lg" /> GitHub Profile
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200">
                <FontAwesomeIcon icon={faLinkedin} className="text-lg text-blue-400" /> LinkedIn Network
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
            </ul>
          </div>
        </div>
      </header>

      {/* Main Apps Layout */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code className="text-emerald-400" /> Software Portfolio
          </h2>
          
          {loading ? (
            <p className="text-gray-500">Loading live modules from backend cloud framework...</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.tech_stack.map((tech, idx) => (
                        <span key={idx} className="bg-gray-900 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20">{tech}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Media Walkthrough Area & Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between">
                    {project.gif_url ? (
                      <img src={project.gif_url} alt={`${project.title} Demo`} className="w-20 h-20 object-cover rounded bg-gray-900 border border-gray-700" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-900 border border-gray-700 rounded flex items-center justify-center text-xs text-gray-600">No Img</div>
                    )}
                    <div className="flex gap-3">
                      {project.apk_url && (
                        <a href={project.apk_url} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition">
                          <Download size={14}/> APK
                        </a>
                      )}
                      <a href="#" className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold px-3 py-2 rounded-lg transition">
                        Repo <ExternalLink size={14}/>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Streaming & Content Section */}
        <section className="mt-16 border-t border-gray-800 pt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Tv className="text-purple-400" /> Media & Streaming Hub
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 p-4 border border-gray-700 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faYoutube} className="text-red-500 text-xl" /> Latest Video
              </h3>
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                <ReactPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" width="100%" height="100%" controls />
              </div>
            </div>
            <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Tv className="text-purple-400"/> Twitch Broadcasts</h3>
                <p className="text-gray-400 text-sm leading-relaxed">I maintain high-quality, silent gameplay vods tracking run logic, structural optimization routing, and pacing mechanics.</p>
              </div>
              <a href="https://twitch.tv" className="mt-6 w-full text-center bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold py-2.5 rounded-lg transition">View Live Stream Channel</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;