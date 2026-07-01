import React, { useState } from 'react'
import ProjectCarousel from './ProjectCarousel'
import Modal from './Modal'
import './ProjectCard.css'

export default function ProjectCard ({ project }) {
  
  const screenshots = Array.isArray(project.screenshot_urls)
    ? project.screenshot_urls
    : typeof project.screenshot_urls === 'string'
    ? project.screenshot_urls.split(';').filter(Boolean)
    : []

  const [isFlipped, setIsFlipped] = useState(false)

  const [activeImage, setActiveImage] = useState(screenshots[0])
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    content: '',
    type: 'text'
  })

  const openModal = (e, title, content, type = 'text') => {
    if (e) e.stopPropagation()
    setModal({ isOpen: true, title, content, type })
  }

  return (
    <>
      {/* CARD WRAPPER */}
      <div
        className='perspective-1000 w-full max-w-[450px] h-[600px] mx-auto'
        onClick={() => setIsFlipped(prev => !prev)}
      >
        <div
          className={`flip-card-inner w-full h-full transition-transform duration-700 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ================= FRONT ================= */}
          <div className='absolute inset-0 backface-hidden bg-gray-900 border border-gray-800 rounded-3xl shadow-xl flex flex-col overflow-hidden'>
            <div className='pt-2 pb-3 px-5 flex-shrink-0 text-center border-b border-gray-800'>
              <p className='text-[10px] uppercase tracking-[0.3em] text-emerald-500 mb-2'>
                Click Card to Flip
              </p>

              <h2 className='text-[2rem] font-black gradient-text tracking-wide'>
                {project.title}
              </h2>
            </div>

            {/* CAROUSEL */}
            <div className='px-5 mt-3 flex-shrink-0'>
              <div
                className='h-48 bg-gray-950 rounded-lg overflow-hidden border border-gray-700'
                onClick={e => {
                  e.stopPropagation()
                  openModal(e, project.title, activeImage, 'image')
                }}
              >
                <ProjectCarousel
                  images={screenshots}
                  onImageChange={setActiveImage}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className='px-5 flex-1 flex flex-col justify-center'>
              <h5 className='text-emerald-300 text-sm font-bold uppercase text-center tracking-wider'>
                Description
              </h5>

              <p className='text-gray-300 text-base leading-relaxed clamp-4 text-center'>
                {project.description}
              </p>

              <div className='mt-5 flex justify-center'>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    openModal(e, project.title, project.description)
                  }}
                  className='text-emerald-400 text-sm underline hover:text-emerald-300 transition'
                >
                  Read Full Description
                </button>
              </div>
            </div>

            {/* FOOTER */}
            <div className='px-5 pb-5 pt-3 border-t border-gray-800 flex-shrink-0 mt-auto'>
              <a
                href={project.download_url}
                download
                onClick={e => e.stopPropagation()}
                className='block w-full py-3 bg-emerald-600 rounded-xl font-bold text-center hover:bg-emerald-500'
              >
                Download App
              </a>
            </div>
          </div>

          {/* ================= BACK ================= */}
          <div className='absolute inset-0 backface-hidden rotate-y-180 bg-gray-800 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden'>
            <div className='pt-2 pb-3 px-5 flex-shrink-0 text-center border-b border-gray-800'>
              <p className='text-[10px] uppercase tracking-[0.3em] text-emerald-500 mb-2'>
                Click Card to Flip
              </p>

              <h2 className='text-[2rem] font-black gradient-text tracking-wide'>
                {project.title}
              </h2>
            </div>

            {/* GIF */}
            <div
              className='h-32 bg-gray-950 rounded-lg overflow-hidden border border-gray-800'
              onClick={e => {
                e.stopPropagation()
                // Add a check to ensure gif_url exists before opening the modal
                if (project.gif_url)
                  openModal(e, 'Demo', project.gif_url, 'image')
              }}
            >
              {project.gif_url ? (
                <img
                  src={project.gif_url}
                  alt='Demo'
                  className='w-full h-full object-contain'
                  onError={e => {
                    e.target.style.display = 'none'
                    console.error('GIF failed to load:', project.gif_url)
                  }}
                />
              ) : (
                <div className='flex items-center justify-center h-full text-gray-600 text-xs'>
                  No GIF
                </div>
              )}
            </div>

            {/* BODY */}
            <div className='px-5 py-3 flex-1 space-y-3'>
              <div className='flex flex-col items-center text-center'>
                <h5 className='text-emerald-300 text-base font-bold uppercase tracking-wider mb-2'>
                  Tech Stack
                </h5>

                <p className='text-emerald-400 text-base mt-1'>
                  <div className='flex flex-wrap justify-center gap-2 mt-1'>
                    {project.tech_stack?.map((tech, i) => (
                      <span
                        key={i}
                        className='text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 rounded-md text-sm shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </p>
              </div>

              <div className='flex flex-col items-center text-center'>
                <h5 className='text-emerald-300 text-base font-bold uppercase tracking-wider mb-2'>
                  DEVELOPER NOTES
                </h5>

                <p className='text-gray-200 text-base mt-1 leading-relaxed'>
                  {project.dev_notes?.slice(0, 120)}...
                </p>

                <div className='flex justify-center mt-2'>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      openModal(e, 'Developer Notes', project.dev_notes)
                    }}
                    className='text-emerald-400 text-xs underline'
                  >
                    Read Full Notes
                  </button>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className='flex gap-2 w-full'>
              <a
                href={project.github_url}
                onClick={e => e.stopPropagation()}
                className='flex-1 text-center py-2 bg-gray-900 rounded-lg text-sm font-bold hover:bg-black'
              >
                GitHub
              </a>

              {project.live_url ? (
                <a
                  href={project.live_url}
                  onClick={e => e.stopPropagation()}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex-1 text-center py-2 bg-purple-700 rounded-lg text-sm font-bold'
                >
                  Live
                </a>
              ) : (
                <div className='flex-1 py-2 rounded-lg bg-gray-800 text-gray-500 text-sm font-bold text-center'>
                  No Live Demo
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        content={modal.content}
        type={modal.type}
      />
    </>
  )
}
