import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  Code2,
  Download,
  ExternalLink,
  Gamepad2,
  Github,
  Image as ImageIcon,
  Wrench,
  X,
} from 'lucide-react';

const CATEGORY_ICONS = {
  software: Code2,
  systems: Boxes,
  games: Gamepad2,
  books: BookOpen,
  tools: Wrench,
};

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getActionLabel(category, project) {
  if (category === 'books') return project.live_url ? 'View book' : 'Download';
  if (category === 'games') return project.live_url ? 'Play / view' : 'Download';
  if (category === 'systems') return project.live_url ? 'View system' : 'Download';
  return project.live_url ? 'Open project' : 'Download';
}

export default function ProjectCard({ project, categoryDefinitions = [] }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const screenshots = useMemo(() => normalizeList(project.screenshot_urls), [project.screenshot_urls]);
  const techStack = useMemo(() => normalizeList(project.tech_stack), [project.tech_stack]);
  const tags = useMemo(() => normalizeList(project.architecture_tags), [project.architecture_tags]);
  const category = project._category || 'software';
  const definition = categoryDefinitions.find((item) => item.id === category);
  const CategoryIcon = CATEGORY_ICONS[category] || Code2;
  const primaryImage = screenshots[0] || project.gif_url || '';
  const primaryUrl = project.live_url || project.download_url || '';

  return (
    <>
      <article className='project-card'>
        <div className={`project-visual project-visual-${category}`}>
          {primaryImage ? (
            <img src={primaryImage} alt={`${project.title} preview`} loading='lazy' />
          ) : (
            <div className='project-placeholder' aria-hidden='true'>
              <CategoryIcon size={42} />
              <span>PGDevHouse</span>
            </div>
          )}
          <div className='project-visual-shade' />
          <span className='category-badge'><CategoryIcon size={14} /> {definition?.label || project.project_type || 'Project'}</span>
          {screenshots.length > 1 && <span className='image-count'><ImageIcon size={13} /> {screenshots.length}</span>}
        </div>

        <div className='project-card-body'>
          <div className='project-title-row'>
            <div>
              {project.project_type && <span className='project-type'>{project.project_type}</span>}
              <h3>{project.title}</h3>
            </div>
            <button className='details-icon-button' type='button' onClick={() => setDetailsOpen(true)} aria-label={`View details for ${project.title}`}>
              <ArrowUpRight size={19} />
            </button>
          </div>

          <p className='project-description'>{project.description}</p>

          {(techStack.length > 0 || tags.length > 0) && (
            <div className='tag-list'>
              {[...techStack, ...tags].slice(0, 5).map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
            </div>
          )}

          <div className='project-card-actions'>
            {primaryUrl && (
              <a className='project-action primary' href={primaryUrl} target={project.live_url ? '_blank' : undefined} rel={project.live_url ? 'noreferrer' : undefined}>
                {project.live_url ? <ExternalLink size={15} /> : <Download size={15} />}
                {getActionLabel(category, project)}
              </a>
            )}
            {project.github_url && (
              <a className='project-action secondary' href={project.github_url} target='_blank' rel='noreferrer'>
                <Github size={15} /> Code
              </a>
            )}
            <button className='project-action ghost' type='button' onClick={() => setDetailsOpen(true)}>Details</button>
          </div>
        </div>
      </article>

      {detailsOpen && (
        <div className='project-modal-backdrop' role='presentation' onMouseDown={() => setDetailsOpen(false)}>
          <div className='project-modal' role='dialog' aria-modal='true' aria-label={`${project.title} details`} onMouseDown={(event) => event.stopPropagation()}>
            <button className='modal-close' type='button' onClick={() => setDetailsOpen(false)} aria-label='Close project details'><X size={20} /></button>
            <div className='modal-header'>
              <span className='category-badge static-badge'><CategoryIcon size={14} /> {definition?.label || 'Project'}</span>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
            </div>

            {screenshots.length > 0 && (
              <div className='modal-gallery'>
                {screenshots.slice(0, 4).map((image, index) => (
                  <a href={image} target='_blank' rel='noreferrer' key={`${image}-${index}`}>
                    <img src={image} alt={`${project.title} screenshot ${index + 1}`} />
                  </a>
                ))}
              </div>
            )}

            <div className='modal-meta-grid'>
              {techStack.length > 0 && <div><span>Built with</span><strong>{techStack.join(' · ')}</strong></div>}
              {tags.length > 0 && <div><span>Focus</span><strong>{tags.join(' · ')}</strong></div>}
            </div>

            {project.dev_notes && (
              <div className='modal-notes'>
                <span>Behind the build</span>
                <p>{project.dev_notes}</p>
              </div>
            )}

            <div className='modal-actions'>
              {project.live_url && <a className='button button-primary' href={project.live_url} target='_blank' rel='noreferrer'>Open project <ExternalLink size={17} /></a>}
              {!project.live_url && project.download_url && <a className='button button-primary' href={project.download_url}>Download <Download size={17} /></a>}
              {project.github_url && <a className='button button-secondary' href={project.github_url} target='_blank' rel='noreferrer'><Github size={17} /> View code</a>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
