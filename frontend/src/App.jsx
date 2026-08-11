import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Code2,
  ExternalLink,
  Gamepad2,
  Layers3,
  Menu,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons';
import ProjectGallery from './pages/ProjectGallery';
import './App.css';

const CATEGORY_DEFINITIONS = [
  { id: 'software', label: 'Software', shortLabel: 'Software', icon: Code2 },
  { id: 'systems', label: 'Systems & Products', shortLabel: 'Systems', icon: Boxes },
  { id: 'games', label: 'Games', shortLabel: 'Games', icon: Gamepad2 },
  { id: 'books', label: 'Books & Writing', shortLabel: 'Books', icon: BookOpen },
  { id: 'tools', label: 'Tools & Utilities', shortLabel: 'Tools', icon: Wrench },
];

const UPCOMING_PROJECTS = [
  {
    title: 'Method Over Magic',
    type: 'Book & Workbook',
    status: 'In Development',
    description:
      'A practical, secular recovery workbook that translates 12-step ideas into concrete reflection, behavior change, and repeatable methods—without requiring a belief in God.',
    note: 'Planned for publication. Release details will be added when the book is ready.',
    icon: BookOpen,
  },
];

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getProjectCategory(project) {
  const source = [
    project?.project_type,
    ...normalizeList(project?.architecture_tags),
    ...normalizeList(project?.tech_stack),
  ].join(' ').toLowerCase();

  if (/book|novel|writing|workbook|memoir|fiction|nonfiction|author/.test(source)) return 'books';
  if (/game|unity|gaming|interactive/.test(source)) return 'games';
  if (/system|product|suite|platform|coach|workflow/.test(source)) return 'systems';
  if (/utility|tool|extension|launcher|tweak/.test(source)) return 'tools';
  return 'software';
}

function extractYouTubeId(url = '') {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const shortsMatch = parsed.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);
    return shortsMatch?.[1] || '';
  } catch {
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([^?&/]+)/);
    return match?.[1] || '';
  }
}

function App() {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [projects, setProjects] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        const response = await fetch(`${API_URL}/api/projects`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Projects request failed (${response.status})`);
        const json = await response.json();
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setProjects(list);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching projects:', error);
          setProjectError('The project list is temporarily unavailable.');
        }
      } finally {
        setProjectsLoading(false);
      }
    }

    async function loadVideos() {
      try {
        const response = await fetch(`${API_URL}/api/youtube`, { signal: controller.signal });
        if (!response.ok) throw new Error(`YouTube request failed (${response.status})`);
        const json = await response.json();
        setYoutubeVideos(Array.isArray(json) ? json : []);
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Error fetching YouTube videos:', error);
      } finally {
        setVideosLoading(false);
      }
    }

    loadProjects();
    loadVideos();
    return () => controller.abort();
  }, [API_URL]);

  const projectsWithCategory = useMemo(
    () => projects.map((project) => ({ ...project, _category: getProjectCategory(project) })),
    [projects],
  );

  const categoryCounts = useMemo(() => (
    projectsWithCategory.reduce((counts, project) => {
      counts[project._category] = (counts[project._category] || 0) + 1;
      return counts;
    }, {})
  ), [projectsWithCategory]);

  const populatedCategories = useMemo(
    () => CATEGORY_DEFINITIONS.filter(({ id }) => categoryCounts[id] > 0),
    [categoryCounts],
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projectsWithCategory.filter((project) => {
      if (activeCategory !== 'all' && project._category !== activeCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        project.title,
        project.description,
        project.project_type,
        ...normalizeList(project.tech_stack),
        ...normalizeList(project.architecture_tags),
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [projectsWithCategory, activeCategory, query]);

  const sortedVideos = useMemo(
    () => [...youtubeVideos].sort((a, b) => new Date(b.video_date || 0) - new Date(a.video_date || 0)),
    [youtubeVideos],
  );

  const featuredVideos = sortedVideos.slice(0, 2);
  const showFilters = projects.length >= 5 && populatedCategories.length > 1;
  const showSearch = projects.length >= 8;

  const scrollToProjects = () => {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className='site-shell'>
      <header className='site-header'>
        <a className='brand-lockup' href='#top' aria-label='PGDevHouse home'>
          <span className='brand-mark' aria-hidden='true'>PG</span>
          <span className='brand-copy'>
            <strong>PGDevHouse</strong>
            <small>Patrick R. Grady</small>
          </span>
        </a>

        <nav className={`primary-nav ${mobileNavOpen ? 'is-open' : ''}`} aria-label='Primary navigation'>
          <a href='#work' onClick={() => setMobileNavOpen(false)}>Work</a>
          <a href='#development' onClick={() => setMobileNavOpen(false)}>In Development</a>
          <a href='#about' onClick={() => setMobileNavOpen(false)}>About</a>
          <a href='#youtube' onClick={() => setMobileNavOpen(false)}>YouTube</a>
        </nav>

        <div className='header-actions'>
          <a className='icon-link' href='https://github.com/patgrady64' target='_blank' rel='noreferrer' aria-label='GitHub'>
            <FontAwesomeIcon icon={faGithub} />
          </a>
          <button
            className='menu-button'
            type='button'
            aria-label='Toggle navigation'
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <main id='top'>
        <section className='hero-section'>
          <div className='hero-content'>
            <span className='eyebrow'>Independent developer & creator</span>
            <h1>Useful things.<br /><span>Interesting ideas.</span></h1>
            <p className='hero-lede'>
              PGDevHouse is where I keep the software, systems, games, tools, and writing I’m building—
              all under one roof, without pretending they’re all the same kind of project.
            </p>
            <div className='hero-actions'>
              <button className='button button-primary' type='button' onClick={scrollToProjects}>
                See what I’m building <ArrowRight size={17} />
              </button>
              <a className='button button-secondary' href='https://github.com/patgrady64' target='_blank' rel='noreferrer'>
                <FontAwesomeIcon icon={faGithub} /> GitHub
              </a>
            </div>
          </div>

          <aside className='hero-note'>
            <span>PGDevHouse</span>
            <p>
              A growing body of work. Right now the focus is on building well and documenting the projects that are ready to show.
            </p>
            {!projectsLoading && projects.length > 0 && (
              <div className='hero-note-meta'>
                <strong>{projects.length}</strong>
                <span>{projects.length === 1 ? 'project currently featured' : 'projects currently featured'}</span>
              </div>
            )}
          </aside>
        </section>

        <section className='work-section' id='work'>
          <div className='section-heading'>
            <div>
              <span className='section-kicker'>Selected work</span>
              <h2>What’s here now.</h2>
            </div>
            <p>
              This collection will grow over time. For now, these are the projects ready to have a home here.
            </p>
          </div>

          {(showFilters || showSearch) && (
            <div className='library-toolbar'>
              {showFilters && (
                <div className='category-filters' role='group' aria-label='Filter projects by category'>
                  <button
                    type='button'
                    className={activeCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
                    onClick={() => setActiveCategory('all')}
                  >
                    All <span>{projects.length}</span>
                  </button>
                  {populatedCategories.map(({ id, shortLabel }) => (
                    <button
                      key={id}
                      type='button'
                      className={activeCategory === id ? 'filter-pill active' : 'filter-pill'}
                      onClick={() => setActiveCategory(id)}
                    >
                      {shortLabel} <span>{categoryCounts[id]}</span>
                    </button>
                  ))}
                </div>
              )}

              {showSearch && (
                <label className='project-search'>
                  <Search size={16} />
                  <input
                    type='search'
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder='Search projects...'
                    aria-label='Search projects'
                  />
                </label>
              )}
            </div>
          )}

          {projectsLoading ? (
            <div className='project-status-grid' aria-label='Loading projects'>
              {[1, 2].map((item) => <div className='project-skeleton' key={item} />)}
            </div>
          ) : projectError ? (
            <div className='library-message error-message'>
              <Layers3 size={21} />
              <div><strong>Couldn’t load the projects.</strong><span>{projectError}</span></div>
            </div>
          ) : (
            <ProjectGallery projects={filteredProjects} categoryDefinitions={CATEGORY_DEFINITIONS} />
          )}
        </section>

        <section className='development-section' id='development'>
          <div className='section-heading development-heading'>
            <div>
              <span className='section-kicker'>In development</span>
              <h2>What’s coming next.</h2>
            </div>
            <p>
              A small look at active work that isn’t released yet. These are real projects in progress, not a list of every idea on the shelf.
            </p>
          </div>

          <div className='development-grid'>
            {UPCOMING_PROJECTS.map((project) => {
              const ProjectIcon = project.icon;
              return (
                <article className='development-card' key={project.title}>
                  <div className='development-card-icon' aria-hidden='true'>
                    <ProjectIcon size={24} strokeWidth={1.7} />
                  </div>
                  <div className='development-card-content'>
                    <div className='development-card-meta'>
                      <span>{project.type}</span>
                      <span className='development-status'><span className='status-dot' aria-hidden='true' /> {project.status}</span>
                    </div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className='development-note'>{project.note}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className='about-section' id='about'>
          <div className='about-intro'>
            <span className='section-kicker'>About</span>
            <h2>Patrick R. Grady</h2>
          </div>
          <div className='about-copy'>
            <p>
              I like taking an idea, annoyance, workflow, or story and turning it into something concrete.
              PGDevHouse gives those projects one place to live while they grow from experiments into finished work.
            </p>
            <p className='future-note'>
              Over time this will include larger systems such as PC Strong and DiamondFlow, along with more software,
              games, utilities, and published writing as each project becomes ready to show.
            </p>
            <div className='about-links'>
              <a href='https://github.com/patgrady64' target='_blank' rel='noreferrer'><FontAwesomeIcon icon={faGithub} /> GitHub</a>
              <a href='https://www.linkedin.com/in/patgrady64/' target='_blank' rel='noreferrer'><FontAwesomeIcon icon={faLinkedin} /> LinkedIn</a>
            </div>
          </div>
        </section>

        <section className='youtube-section' id='youtube'>
          <div className='youtube-heading'>
            <div>
              <span className='section-kicker'>Side hobby</span>
              <h2>YouTube</h2>
            </div>
            <a className='text-link' href='https://www.youtube.com/@iminvisibl2u' target='_blank' rel='noreferrer'>
              Visit channel <ExternalLink size={14} />
            </a>
          </div>

          <div className='video-grid'>
            {videosLoading ? (
              [1, 2].map((item) => <div className='video-card video-skeleton' key={item} />)
            ) : featuredVideos.length ? (
              featuredVideos.map((video) => {
                const videoId = extractYouTubeId(video.youtube_url);
                return (
                  <a className='video-card' href={video.youtube_url} target='_blank' rel='noreferrer' key={video.id || video.youtube_url}>
                    <div className='video-thumb'>
                      {videoId ? <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt='' /> : <FontAwesomeIcon icon={faYoutube} />}
                      <span className='play-badge'>▶</span>
                    </div>
                    <div className='video-copy'>
                      <span>{video.game || 'YouTube'}</span>
                      <strong>{video.title}</strong>
                    </div>
                  </a>
                );
              })
            ) : (
              <div className='video-empty'>The channel is linked above; recent videos will appear here when available.</div>
            )}
          </div>
        </section>
      </main>

      <footer className='site-footer'>
        <div><strong>PGDevHouse</strong><span>Built by Patrick R. Grady</span></div>
        <div className='footer-meta'>
          <a href='https://github.com/patgrady64' target='_blank' rel='noreferrer'>GitHub</a>
          <a href='https://www.linkedin.com/in/patgrady64/' target='_blank' rel='noreferrer'>LinkedIn</a>
          <a href='/admin'>Admin</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
