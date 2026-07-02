import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Tv, Code } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGithub,
  faLinkedin,
  faYoutube
} from '@fortawesome/free-brands-svg-icons'

import AdminDashboard from './pages/AdminDashboard'
import ProjectGallery from './pages/ProjectGallery'

function App () {
  const API_URL = import.meta.env.VITE_API_URL || ''

  const [projects, setProjects] = useState([])
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [videosLoading, setVideosLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects`)
        const json = await res.json()

        const list = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : []

        setProjects(list)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setProjects([])
      } finally {
        setProjectsLoading(false)
      }
    }

    loadProjects()
  }, [API_URL])

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/youtube`)
        const data = await res.json()
        setYoutubeVideos(Array.isArray(data) ? data : [])

        if (data && data.length > 0) {
          setSelectedVideo(data[0])
        }
      } catch (err) {
        console.error('Error fetching YouTube videos:', err)
      } finally {
        setVideosLoading(false)
      }
    }
    loadVideos()
  }, [API_URL])

  const getThumbnail = video =>
    video.youtube_url
      ? `https://img.youtube.com/vi/${extractId(
          video.youtube_url
        )}/hqdefault.jpg`
      : ''

  const extractId = url => {
    if (!url) return ''
    const match = url.match(/v=([^&]+)/)
    return match?.[1] || ''
  }

  const activeVideo = selectedVideo || youtubeVideos[0]

  const sortedVideos = [...youtubeVideos].sort((a, b) => {
    return new Date(b.video_date) - new Date(a.video_date)
  })

  return (
    <Routes>
      <Route path='/admin' element={<AdminDashboard />} />
      <Route
        path='/'
        element={
          <div className='min-h-screen bg-gray-900 text-gray-100 font-sans'>
            <header className='relative overflow-hidden border-b border-gray-800/80 bg-gradient-to-b from-slate-950 via-gray-900 to-gray-900 py-20 px-4'>
              <div className='absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none'></div>
              <div className='absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none'></div>

              <div className='max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8'>
                <div className='max-w-2xl text-center md:text-left'>
                  <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6 tracking-wide backdrop-blur-sm animate-pulse'>
                    <span className='w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'></span>
                    API ENGINE: OPERATIONAL
                  </div>

                  <h1 className='text-4xl md:text-6xl font-black text-white tracking-tight leading-none'>
                    Patrick R.{' '}
                    <span className='bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400'>
                      Grady
                    </span>
                  </h1>

                  <p className='text-xl md:text-2xl text-slate-300 mt-3 font-semibold tracking-wide'>
                    Software Engineer{' '}
                    <span className='text-emerald-500/40 font-light'>|</span> AI
                    Integration Specialist
                  </p>

                  <p className='text-gray-400 mt-6 leading-relaxed text-base md:text-lg max-w-xl'>
                    Building dynamic full-stack infrastructure and highly
                    optimized mobile applications. Focused on algorithmic
                    structural execution and intelligent workflows.
                  </p>

                  <p className='text-gray-400 mt-3 leading-relaxed text-base md:text-lg max-w-xl'>
                    When the compiler rests, I reverse-engineer retro game
                    architecture—analyzing routing logic, seed pacing, and
                    combat mechanics for{' '}
                    <span className='text-amber-400 font-medium'>Zelda 1</span>{' '}
                    and{' '}
                    <span className='text-amber-400 font-medium'>
                      Super Mario Bros. 3
                    </span>{' '}
                    Randomizers.
                  </p>

                  <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8'>
                    <a
                      href='https://github.com/patgrady64'
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-700 hover:border-gray-600 shadow-md transition-all duration-200'
                    >
                      <FontAwesomeIcon icon={faGithub} className='text-lg' />{' '}
                      GitHub Profile
                    </a>
                    <a
                      href='https://www.linkedin.com/in/patgrady64/'
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200'
                    >
                      <FontAwesomeIcon
                        icon={faLinkedin}
                        className='text-lg text-blue-400'
                      />{' '}
                      LinkedIn Network
                    </a>
                    <a
                      href='https://www.youtube.com/@iminvisibl2u'
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 font-medium text-sm px-4 py-2.5 rounded-xl border border-red-900/30 hover:border-red-700/50 transition-all duration-200'
                    >
                      <FontAwesomeIcon icon={faYoutube} className='text-lg' />{' '}
                      YouTube Channel
                    </a>
                  </div>
                </div>

                <div className='w-full md:w-80 bg-gray-950/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl self-start md:self-auto'>
                  <h3 className='text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4 flex items-center justify-between'>
                    <span>Environment Profile</span>
                    <span className='text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono'>
                      v1.0.0
                    </span>
                  </h3>
                  <ul className='space-y-3 font-mono text-xs'>
                    <li className='flex justify-between'>
                      <span className='text-gray-500'>Focus:</span>{' '}
                      <span className='text-emerald-400'>
                        AI & Software Eng.
                      </span>
                    </li>
                    <li className='flex justify-between'>
                      <span className='text-gray-500'>Frameworks:</span>{' '}
                      <span className='text-slate-300'>
                        React, Flask, Supabase
                      </span>
                    </li>
                    <li className='flex justify-between'>
                      <span className='text-gray-500'>Languages:</span>{' '}
                      <span className='text-slate-300'>Python, Kotlin</span>
                    </li>
                    <li className='flex justify-between'>
                      <span className='text-gray-500'>Routing Target:</span>{' '}
                      <span className='text-amber-400'>Z1R / SMB3R</span>
                    </li>
                    <li className='flex justify-between pt-2 border-t border-gray-800/40'>
                      <span className='text-gray-600'>Console Pipeline:</span>
                      <Link
                        to='/admin'
                        className='text-gray-500 hover:text-emerald-400 transition-colors duration-150'
                      >
                        Open Admin →
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </header>

            <main className='max-w-6xl mx-auto px-6 py-16 space-y-20'>
              <section>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-10 border-b border-gray-800 pb-4'>
                  <h2 className='text-2xl font-bold text-white tracking-tight flex items-center gap-3'>
                    <Code className='text-emerald-400 stroke-[2.5]' size={22} />{' '}
                    Production Software Projects
                  </h2>
                </div>
                {projectsLoading ? (
                  <p>Loading...</p>
                ) : (
                  <ProjectGallery projects={projects} />
                )}
              </section>

              <section>
                <div className='mb-10 border-b border-gray-800 pb-4'>
                  <h2 className='text-2xl font-bold text-white tracking-tight flex items-center gap-3'>
                    <Tv className='text-purple-400 stroke-[2.5]' size={22} />{' '}
                    Randomizer Run Archive{' '}
                  </h2>
                  <p className='text-sm text-gray-500 mt-1'>
                    A curated archive of gameplay runs generated from randomized
                    and seeded games.
                  </p>
                </div>

                <div className='space-y-8'>
                  {' '}
                  {/* ROW 1 */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Thumbnail */}
                    <div className='aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-900 shadow-inner relative'>
                      <img
                        src={
                          activeVideo?.youtube_url
                            ? `https://img.youtube.com/vi/${extractId(
                                activeVideo.youtube_url
                              )}/hqdefault.jpg`
                            : null
                        }
                        className='w-full h-full object-cover'
                        alt={activeVideo?.title}
                      />

                      <div className='absolute inset-0 bg-black/40' />

                      <a
                        href={activeVideo?.youtube_url}
                        target='_blank'
                        rel='noreferrer'
                        className='absolute inset-0'
                      />

                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='bg-red-600 text-white px-6 py-3 rounded-full font-bold'>
                          ▶ Play
                        </div>
                      </div>
                    </div>

                    {/* Description Panel */}
                    <div className='bg-gray-900 border border-gray-800 rounded-xl p-4'>
                      <h3 className='text-white font-bold text-lg mb-2'>
                        {activeVideo?.title}
                      </h3>

                      <p className='text-xs text-gray-400 mb-3'>
                        {activeVideo?.video_date}
                      </p>

                      <div className='text-sm text-gray-300 max-h-64 overflow-y-auto pr-2'>
                        {activeVideo?.description}
                      </div>
                    </div>
                  </div>
                  {/* ROW 2 */}
                  <div className='border border-gray-800 rounded-xl overflow-hidden'>
                    <table className='w-full text-sm text-left'>
                      <thead className='bg-gray-900 text-gray-400 text-xs uppercase'>
                        <tr>
                          <th className='px-3 py-2'>Title</th>
                          <th className='px-3 py-2'>Game</th>
                          <th className='px-3 py-2'>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedVideos.map(video => (
                          <tr
                            key={video.id}
                            onClick={() => setSelectedVideo(video)}
                            className={`cursor-pointer hover:bg-gray-800 ${
                              selectedVideo?.id === video.id
                                ? 'bg-gray-800'
                                : ''
                            }`}
                          >
                            <td className='px-3 py-2 text-white font-medium'>
                              {video.title}
                            </td>
                            <td className='px-3 py-2 text-white font-medium'>
                              {video.game}
                            </td>
                            <td className='px-3 py-2 text-gray-400'>
                              {video.video_date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* ROW 3 */}
                  <div className='bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6'>
                    <div>
                      <h3 className='text-sm font-bold text-white tracking-wide flex items-center gap-2'>
                        <Tv className='text-purple-400' size={16} /> BROADCAST
                        SPECIFICATIONS
                      </h3>

                      <p className='text-xs text-gray-400 mt-3 leading-relaxed'>
                        Gameplay capture sequences run on a localized, silent
                        system environment...
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        }
      />
    </Routes>
  )
}

export default App
