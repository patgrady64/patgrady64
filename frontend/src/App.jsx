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
      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-4 py-16 text-center md:text-left md:flex md:items-center md:justify-between border-b border-gray-800">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Patrick R Grady</h1>
          <p className="text-xl text-emerald-400 mt-2 font-medium">Software Engineer / AI Integration Specialist</p>
          <p className="text-gray-400 mt-4 max-w-xl leading-relaxed">
            Building full-stack tools and interactive mobile experiences. When I'm not writing code, 
            you can usually find me analyzing routing logic and racing retro game randomizers like 
            <span className="text-amber-400 font-semibold"> Zelda 1 Randomizer (Z1R)</span> and 
            <span className="text-amber-400 font-semibold"> Super Mario Bros 3 Randomizer (SMB3R)</span>.
          </p>
          <div className="flex gap-4 mt-6 justify-center md:justify-start">
            <a href="https://github.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <FontAwesomeIcon icon={faGithub} className="text-xl" /> GitHub
            </a>
            <a href="https://linkedin.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
              <FontAwesomeIcon icon={faLinkedin} className="text-xl" /> LinkedIn
            </a>
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