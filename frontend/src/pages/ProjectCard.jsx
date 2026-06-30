import React from 'react'

const InfoPopup = ({ label, text }) => (
  <div className='relative group/tooltip inline-block ml-1'>
    <span className='text-emerald-500 cursor-help font-mono'>...more</span>
    <div className='absolute bottom-full left-0 w-72 bg-gray-950 border border-emerald-500/50 p-4 rounded-xl shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-gray-200'>
      <h4 className='font-bold text-emerald-400 mb-1'>{label}</h4>
      {text}
    </div>
  </div>
)

export default function ProjectCard ({ project }) {
  return (
    <div className='group bg-gradient-to-b from-gray-950 to-gray-900 border border-gray-800 rounded-3xl p-6 transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/10'>
      {/* Hero Visual */}
      <div className='relative h-48 mb-6 rounded-2xl overflow-hidden border border-gray-800'>
        {project.gif_url ? (
          <img
            src={project.gif_url}
            alt={project.title}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gray-950 flex items-center justify-center text-gray-700 font-mono'>
            NO VISUAL
          </div>
        )}
      </div>

      <h3 className='text-2xl font-bold text-white mb-3'>{project.title}</h3>

      {/* Description with Hover Popup */}
      <p className='text-gray-400 text-sm mb-4 line-clamp-3'>
        {project.description}
        {project.description?.length > 100 && (
          <InfoPopup label='Full Description' text={project.description} />
        )}
      </p>

      {/* Developer Notes */}
      {project.dev_notes && (
        <p className='text-gray-500 text-xs italic mb-6 line-clamp-2'>
          Notes: {project.dev_notes}
          <InfoPopup label='Developer Notes' text={project.dev_notes} />
        </p>
      )}

      {/* Download Link */}
      <a
        href={project.download_url}
        target='_blank'
        rel='noreferrer'
        className='block w-full text-center py-3 bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all'
      >
        Download Build
      </a>
    </div>
  )
}
