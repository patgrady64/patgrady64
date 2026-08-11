import ProjectCard from './ProjectCard';

export default function ProjectGallery({ projects, categoryDefinitions = [] }) {
  if (!projects.length) {
    return (
      <div className='library-message'>
        <div>
          <strong>No projects match this view.</strong>
          <span>Try another category or clear the search.</span>
        </div>
      </div>
    );
  }

  return (
    <div className='project-grid'>
      {projects.map((project) => (
        <ProjectCard
          key={project.id || project.title}
          project={project}
          categoryDefinitions={categoryDefinitions}
        />
      ))}
    </div>
  );
}
