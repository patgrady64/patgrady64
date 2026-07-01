import React from 'react'
import ProjectCard from './ProjectCard'

export default function ProjectGallery({ projects }) {
  return (
    <div className="flex flex-wrap justify-center gap-10">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  )
}