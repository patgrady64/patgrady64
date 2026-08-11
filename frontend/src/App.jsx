import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Code2,
  ExternalLink,
  Gamepad2,
  Github,
  Layers3,
  Linkedin,
  Menu,
  Search,
  Sparkles,
  Wrench,
  X,
  Youtube,
} from 'lucide-react';
import ProjectGallery from './pages/ProjectGallery';
import './App.css';

const CATEGORY_DEFINITIONS = [
  {
    id: 'software',
    label: 'Software',
    shortLabel: 'Software',
    icon: Code2,
    description: 'Web, mobile, desktop, and full-stack applications.',
  },
  {
    id: 'systems',
    label: 'Systems & Products',
    shortLabel: 'Systems',
    icon: Boxes,
    description: 'Larger product ecosystems, workflows, and packaged solutions.',
  },
  {
    id: 'games',
    label: 'Games',
    shortLabel: 'Games',
    icon: Gamepad2,
    description: 'Original games, prototypes, and interactive experiments.',
  },
  {
    id: 'books',
    label: 'Books & Writing',
    shortLabel: 'Books',
    icon: BookOpen,
    description: 'Fiction, nonfiction, workbooks, and long-form creative projects.',
  },
  {
    id: 'tools',
    label: 'Tools & Utilities',
    shortLabel: 'Tools',
    icon: Wrench,
    description: 'Focused utilities that solve one annoying problem well.',
  },
];

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function getProjectCategory(project) {
  const source = [
    project?.project_type,
    ...normalizeList(project?.architecture_tags),
    ...normalizeList(project?.tech_stack),
  ]
    .join(' ')
    .toLowerCase();

  if (/book|novel|writing|workbook|memoir|fiction|nonfiction|author/.test(source)) {
    return 'books';
  }
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
        const response = await fetch(`${API_URL}/api/projects`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Projects request failed (${response.status})`);
        const json = await response.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];
        setProjects(list);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching projects:', error);
          setProjectError('The project library is temporarily unavailable.');
        }
      } finally {
        setProjectsLoading(false);
      }
    }

    async function loadVideos() {
      try {
        const response = await fetch(`${API_URL}/api/youtube`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`YouTube request failed (${response.status})`);
        const json = await response.json();
        setYoutubeVideos(Array.isArray(json) ? json : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching YouTube videos:', error);
        }
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

  const categoryCounts = useMemo(() => {
    return projectsWithCategory.reduce((counts, project) => {
      counts[project._category] = (counts[project._category] || 0) + 1;
      return counts;
    }, {});
  }, [projectsWithCategory]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projectsWithCategory.filter((project) => {
      const matchesCategory = activeCategory === 'all' || project._category === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        project.title,
        project.description,
        project.project_type,
        ...normalizeList(project.tech_stack),
        ...normalizeList(project.architecture_tags),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [projectsWithCategory, activeCategory, query]);

  const sortedVideos = useMemo(
    () =>
      [...youtubeVideos].sort(
        (a, b) => new Date(b.video_date || 0) - new Date(a.video_date || 0),
      ),
    [youtubeVideos],
  );

  const featuredVideos = sortedVideos.slice(0, 3);

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
            <small>Build. Test. Refine.</small>
          </span>
        </a>

        <nav className={`primary-nav ${mobileNavOpen ? 'is-open' : ''}`} aria-label='Primary navigation'>
          <a href='#work' onClick={() => setMobileNavOpen(false)}>Work</a>
          <a href='#studio' onClick={() => setMobileNavOpen(false)}>Studio</a>
          <a href='#after-hours' onClick={() => setMobileNavOpen(false)}>After Hours</a>
          <a href='#about' onClick={() => setMobileNavOpen(false)}>About</a>
        </nav>

        <div className='header-actions'>
          <a className='icon-link' href='https://github.com/patgrady64' target='_blank' rel='noreferrer' aria-label='GitHub'>
            <Github size={19} />
          </a>
          <button
            className='menu-button'
            type='button'
            aria-label='Toggle navigation'
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main id='top'>
        <section className='hero-section'>
          <div className='hero-glow hero-glow-one' />
          <div className='hero-glow hero-glow-two' />
          <div className='hero-grid' />

          <div className='hero-content'>
            <div className='eyebrow'>
              <Sparkles size={15} />
              Independent software studio + creative lab
            </div>
            <h1>
              One home for <span>everything I build.</span>
            </h1>
            <p className='hero-lede'>
              PGDevHouse is the working portfolio of Patrick R. Grady—software,
              games, practical systems, books, experiments, and the tools that grow
              out of solving real problems.
            </p>
            <div className='hero-actions'>
              <button className='button button-primary' type='button' onClick={scrollToProjects}>
                Explore the work <ArrowRight size={18} />
              </button>
              <a className='button button-secondary' href='https://github.com/patgrady64' target='_blank' rel='noreferrer'>
                <Github size={18} /> GitHub
              </a>
            </div>
          </div>

          <aside className='hero-panel' aria-label='PGDevHouse focus areas'>
            <div className='hero-panel-label'>Inside PGDevHouse</div>
            <div className='focus-stack'>
              {CATEGORY_DEFINITIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type='button'
                  className='focus-row'
                  onClick={() => {
                    setActiveCategory(id);
                    scrollToProjects();
                  }}
                >
                  <span className='focus-icon'><Icon size={18} /></span>
                  <span>{label}</span>
                  <span className='focus-count'>{categoryCounts[id] || '—'}</span>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className='studio-strip' id='studio'>
          <div className='section-heading compact-heading'>
            <div>
              <span className='section-kicker'>Not just an app portfolio</span>
              <h2>Built across different kinds of work.</h2>
            </div>
            <p>
              PC Strong and DiamondFlow belong beside apps and games. Books belong here too.
              The site is organized around what a project <em>is</em>, not what file type it happens to ship as.
            </p>
          </div>

          <div className='discipline-grid'>
            {CATEGORY_DEFINITIONS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type='button'
                className='discipline-card'
                onClick={() => {
                  setActiveCategory(id);
                  scrollToProjects();
                }}
              >
                <span className='discipline-icon'><Icon size={21} /></span>
                <strong>{label}</strong>
                <span>{description}</span>
                <span className='discipline-link'>Browse {label.toLowerCase()} <ArrowRight size={15} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className='work-section' id='work'>
          <div className='section-heading'>
            <div>
              <span className='section-kicker'>Project library</span>
              <h2>The work, all in one place.</h2>
            </div>
            <p>
              Filter by discipline or search across titles, technologies, descriptions, and tags.
            </p>
          </div>

          <div className='library-toolbar'>
            <div className='category-filters' role='group' aria-label='Filter projects by category'>
              <button
                type='button'
                className={activeCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setActiveCategory('all')}
              >
                All <span>{projects.length || '—'}</span>
              </button>
              {CATEGORY_DEFINITIONS.map(({ id, shortLabel }) => (
                <button
                  key={id}
                  type='button'
                  className={activeCategory === id ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => setActiveCategory(id)}
                >
                  {shortLabel} <span>{categoryCounts[id] || 0}</span>
                </button>
              ))}
            </div>

            <label className='project-search'>
              <Search size={17} />
              <input
                type='search'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search projects...'
                aria-label='Search projects'
              />
            </label>
          </div>

          {projectsLoading ? (
            <div className='project-status-grid' aria-label='Loading projects'>
              {[1, 2, 3].map((item) => <div className='project-skeleton' key={item} />)}
            </div>
          ) : projectError ? (
            <div className='library-message error-message'>
              <Layers3 size={22} />
              <div><strong>Couldn’t load the project library.</strong><span>{projectError}</span></div>
            </div>
          ) : (
            <ProjectGallery projects={filteredProjects} categoryDefinitions={CATEGORY_DEFINITIONS} />
          )}
        </section>

        <section className='after-hours-section' id='after-hours'>
          <div className='after-hours-copy'>
            <span className='section-kicker'>After hours</span>
            <h2>YouTube is still here—just not running the place.</h2>
            <p>
              Retro-game randomizers, routing experiments, and gameplay are a hobby archive,
              separate from the main PGDevHouse project catalog.
            </p>
            <a className='text-link' href='https://www.youtube.com/@iminvisibl2u' target='_blank' rel='noreferrer'>
              Visit the channel <ExternalLink size={15} />
            </a>
          </div>

          <div className='video-grid'>
            {videosLoading ? (
              [1, 2, 3].map((item) => <div className='video-card video-skeleton' key={item} />)
            ) : featuredVideos.length ? (
              featuredVideos.map((video) => {
                const videoId = extractYouTubeId(video.youtube_url);
                return (
                  <a className='video-card' href={video.youtube_url} target='_blank' rel='noreferrer' key={video.id || video.youtube_url}>
                    <div className='video-thumb'>
                      {videoId ? <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt='' /> : <Youtube size={30} />}
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
              <div className='video-empty'>YouTube archive will appear here when videos are available.</div>
            )}
          </div>
        </section>

        <section className='about-section' id='about'>
          <div className='about-monogram' aria-hidden='true'>PRG</div>
          <div className='about-copy'>
            <span className='section-kicker'>About the builder</span>
            <h2>Patrick R. Grady</h2>
            <p>
              I build things because I like turning an idea, irritation, workflow, or story into
              something concrete. PGDevHouse is where those projects live together instead of being
              scattered across unrelated repos, downloads, documents, and experiments.
            </p>
            <div className='about-links'>
              <a href='https://github.com/patgrady64' target='_blank' rel='noreferrer'><Github size={17} /> GitHub</a>
              <a href='https://www.linkedin.com/in/patgrady64/' target='_blank' rel='noreferrer'><Linkedin size={17} /> LinkedIn</a>
              <a href='https://www.youtube.com/@iminvisibl2u' target='_blank' rel='noreferrer'><Youtube size={17} /> YouTube</a>
            </div>
          </div>
        </section>
      </main>

      <footer className='site-footer'>
        <div>
          <strong>PGDevHouse</strong>
          <span>Software, systems, games, books, and useful experiments.</span>
        </div>
        <div className='footer-meta'>
          <span>Built by Patrick R. Grady</span>
          <a href='/admin'>Admin</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
