import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
  UploadCloud,
  LogOut,
  Terminal,
  ShieldAlert,
  FileCode
} from 'lucide-react'

export default function AdminDashboard () {
  const hasAsset = (folder, project, name) => {
    return existingFiles.some(
      f => f.folder === folder && f.project === project && f.name === name
    )
  }

  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [fetchingProjects, setFetchingProjects] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [projects, setProjects] = useState([])
  const [expandedProjects, setExpandedProjects] = useState({})
  const [existingFiles, setExistingFiles] = useState([])

  const fileInputRef = React.useRef(null)

  const fetchProjects = async () => {
    setFetchingProjects(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`)
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setFetchingProjects(false)
    }
  }

  const getScreenshotCount = projectTitle => {
    return existingFiles.filter(
      f => f.folder === 'screenshots' && f.project === projectTitle
    ).length
  }

  const groupedFiles = existingFiles.reduce((acc, path) => {
    const parts = path.split('/')

    if (parts.length < 3) return acc

    const folder = parts[0]
    const project = parts[1]
    const name = parts.slice(2).join('/')

    // const fetchData = async () => {
    //   if (!session) return

    //   try {
    //     // Fetch Projects
    //     const projRes = await fetch(
    //       `${import.meta.env.VITE_API_URL}/api/projects`
    //     )
    //     const projData = await projRes.json()
    //     setProjects(projData)

    //     // Fetch Assets
    //     const assetRes = await fetch(
    //       `${import.meta.env.VITE_API_URL}/api/admin/check-all-assets`
    //     )
    //     const assetData = await assetRes.json()
    //     setExistingFiles(Array.isArray(assetData.files) ? assetData.files : [])
    //   } catch (err) {
    //     console.error('Data fetch failed:', err)
    //   }
    // }

    useEffect(() => {
      fetchData()
    }, [session])

    //2. Properly derived groupedFiles
    //   const groupedFiles = React.useMemo(() => {
    //     return existingFiles.reduce((acc, path) => {
    //       const parts = path.split('/')
    //       if (parts.length < 3) return acc
    //       const folder = parts[0]
    //       const project = parts[1]
    //       const name = parts.slice(2).join('/') /*  */
    //       if (!acc[project]) acc[project] = []
    //       acc[project].push({ folder, name })
    //       return acc
    //     }, {})
    //   }, [existingFiles])

    //   if (!acc[project]) {
    //     acc[project] = []
    //   }

    //   acc[project].push({
    //     folder,
    //     name
    //   })

    //   return acc
    // }, {})

    const toggleProject = projectName => {
      setExpandedProjects(prev => ({
        ...prev,
        [projectName]: !prev[projectName]
      }))
    }

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }, [])

    const API_BASE = 'https://patgrady64.onrender.com'

    useEffect(() => {
      if (session) {
        const url = `${API_BASE}/api/admin/check-all-assets`
        console.log('Fetching from:', url) // Verify this matches your backend
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
            return res.json()
          })
          .then(data => {
            console.log('Files received:', data)
            setExistingFiles(data || [])
          })
          .catch(err => console.error('Fetch failed:', err))
      }
    }, [session])

    const handleLogin = async e => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) setError(error.message)
      setLoading(false)
    }

    const handleLogout = async () => {
      await supabase.auth.signOut()
    }

    // Fetch projects from live production database API
    useEffect(() => {
      if (!session) return

      fetch(`${import.meta.env.VITE_API_URL}/api/admin/check-all-assets`)
        .then(res => res.json())
        .then(data => {
          setExistingFiles(Array.isArray(data) ? data : [])
        })
        .catch(err => {
          console.error('Asset check failed:', err)
        })
    }, [session])

    useEffect(() => {
      fetchProjects()
    }, [session])

    useEffect(() => {
      if (!session) return

      fetch(`${import.meta.env.VITE_API_URL}/api/admin/check-all-assets`)
        .then(res => res.json())
        .then(data => {
          setExistingFiles(Array.isArray(data) ? data : [])
        })
        .catch(err => {
          console.error('Asset fetch failed:', err)
        })
    }, [session])

    // --- DRAG AND DROP PIPELINE INTERCEPT HANDLERS ---
    const handleDragOver = e => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async e => {
      e.preventDefault()
      e.stopPropagation()

      if (uploading) return

      const items = e.dataTransfer.items
      if (!items || items.length === 0) return

      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        const filePromises = []

        // Helper function to recursively read files from directories (DataTransferItem/FileSystemEntry API)
        const traverseDirectory = (entry, path = '') => {
          return new Promise((resolve, reject) => {
            if (entry.isFile) {
              entry.file(file => {
                // Map the plain file object into the proper target parameter name for our endpoint
                if (file.name === 'info.csv') {
                  formData.append('info_csv', file)
                } else {
                  formData.append(file.name, file)
                }
                resolve()
              }, reject)
            } else if (entry.isDirectory) {
              const dirReader = entry.createReader()
              dirReader.readEntries(async entries => {
                const promises = entries.map(innerEntry =>
                  traverseDirectory(innerEntry, `${path}${entry.name}/`)
                )
                await Promise.all(promises)
                resolve()
              }, reject)
            }
          })
        }

        // Loop over all top-level items dropped into the layout zone
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null
            if (entry) {
              filePromises.push(traverseDirectory(entry))
            }
          }
        }

        await Promise.all(filePromises)

        if (!formData.has('info_csv')) {
          throw new Error(
            "Missing mandatory 'info.csv' configuration file in dropped structure."
          )
        }

        const result = await streamPayloadToPipeline(formData)
        fetchProjects()
      } catch (err) {
        console.error('Drop Upload Error:', err)
        setError(err.message)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }

    const handleFolderSelect = async fileList => {
      if (uploading) return
      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        let hasInfoCsv = false

        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i]

          // Extract clean base filename regardless of nested folder string paths
          const baseName = file.name.split('/').pop().split('\\').pop()

          if (baseName.toLowerCase() === 'info.csv') {
            formData.append('info_csv', file)
            hasInfoCsv = true
          } else {
            // Use clean baseName as the parameter key for backend streaming matching
            formData.append(baseName, file)
          }
        }

        if (!hasInfoCsv) {
          throw new Error(
            "Missing mandatory 'info.csv' configuration file in selected directory."
          )
        }

        const result = await streamPayloadToPipeline(formData)
        console.log('Folder Selection Synchronized Successfully:', result)
        fetchProjects() // Refresh table dashboard data
      } catch (err) {
        console.error('Selection Upload Error:', err)
        setError(err.message)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    }

    const streamPayloadToPipeline = formData => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const targetUrl = `${
          import.meta.env.VITE_API_URL || 'http://localhost:5000'
        }/api/admin/sync-project`

        xhr.open('POST', targetUrl, true)

        // Listen to active upload streaming ticks
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percentage)
          }
        }

        xhr.onload = () => {
          let result = {}
          try {
            result = JSON.parse(xhr.responseText)
          } catch (e) {}

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(result)
          } else {
            reject(
              new Error(
                result.error ||
                  'Inversion pipeline failed to process directory files.'
              )
            )
          }
        }

        xhr.onerror = () =>
          reject(new Error('Network telemetry failure during pipeline stream.'))
        xhr.send(formData)
      })
    }

    // --- 1. LOGIN SCREEN ---
    if (!session) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            color: '#fff'
          }}
        >
          <form
            onSubmit={handleLogin}
            style={{
              background: '#1e1e1e',
              padding: '2rem',
              borderRadius: '8px',
              width: '320px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              Admin Portal
            </h2>

            {error && (
              <div
                style={{
                  color: '#ff4d4d',
                  marginBottom: '1rem',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '14px'
                }}
              >
                Email
              </label>
              <input
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  background: '#121212',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '14px'
                }}
              >
                Password
              </label>
              <input
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  background: '#121212',
                  color: '#fff'
                }}
              />
            </div>

            <button
              type='submit'
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      )
    }

    // --- 2. PROTECTED ADMIN PANEL ---
    // --- 2. PROTECTED ADMIN PANEL ---
    return (
      <div className='min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-12'>
        <div className='max-w-4xl mx-auto space-y-8'>
          {/* Header Console Row */}
          <header className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6'>
            <div>
              <h1 className='text-2xl font-black text-white tracking-tight flex items-center gap-2.5'>
                <Terminal className='text-emerald-400 stroke-[2.5]' size={24} />
                SYSTEM INGESTION ENGINE
              </h1>
              <p className='text-xs font-mono text-gray-500 mt-1 flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse'></span>
                SECURE SESSION ACCESS // {session.user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className='flex items-center justify-center gap-2 font-mono text-xs text-red-400 hover:text-white bg-red-950/20 hover:bg-red-600 border border-red-900/40 hover:border-red-500 px-4 py-2 rounded-xl transition-all duration-200 self-start sm:self-auto shadow-md'
            >
              <LogOut size={14} /> Sign Out Terminal
            </button>
          </header>

          {/* Dynamic Drag and Drop Asset Control */}
          <main>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()} // <-- Triggers picker on click
              className={`group relative bg-gradient-to-b from-gray-950/40 to-gray-950/80 border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/5 flex flex-col items-center justify-center min-h-[340px] cursor-pointer ${
                uploading
                  ? 'border-amber-500/50 bg-amber-950/5'
                  : 'border-gray-800 hover:border-emerald-500/40'
              }`}
            >
              {/* INVISIBLE FOLDER PICKER INPUT */}
              <input
                type='file'
                ref={fileInputRef}
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFolderSelect(e.target.files)
                  }
                }}
                style={{ display: 'none' }}
                webkitdirectory='' // <-- Essential for folder access
                directory='' // <-- Fallback for alternative engines
                multiple
              />

              <div className='absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none'></div>

              <div className='relative z-10 max-w-sm mx-auto space-y-4'>
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl bg-gray-900 border flex items-center justify-center shadow-inner transition-colors duration-300 ${
                    uploading
                      ? 'border-amber-500/30 bg-gray-900/40'
                      : 'border-gray-800 group-hover:border-emerald-500/20 group-hover:bg-gray-900/60'
                  }`}
                >
                  <UploadCloud
                    className={`transition-colors duration-300 stroke-[1.5] ${
                      uploading
                        ? 'text-amber-400 animate-bounce'
                        : 'text-gray-500 group-hover:text-emerald-400'
                    }`}
                    size={32}
                  />
                </div>

                <div className='space-y-1.5'>
                  <p className='text-base font-semibold text-slate-200'>
                    {uploading
                      ? `Processing & streaming asset build... (${uploadProgress}%)`
                      : 'Drag & drop or click to select project folder'}
                  </p>

                  {/* Progress Bar Container Track */}
                  {uploading && (
                    <div className='w-full max-w-xs mx-auto bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800 p-0.5 mt-3 shadow-inner'>
                      <div
                        className='bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}

                  <p className='text-xs text-gray-500 max-w-xs mx-auto leading-relaxed pt-1'>
                    {error ? (
                      <span className='text-red-400 font-mono block'>
                        {error}
                      </span>
                    ) : (
                      <>
                        Select or drop a localized production directory
                        containing a structural{' '}
                        <span className='text-amber-400 font-mono'>
                          info.csv
                        </span>{' '}
                        file and compiled application assets.
                      </>
                    )}
                  </p>
                </div>

                <div className='flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2'>
                  <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800/80 text-[10px] font-mono text-slate-400 shadow-sm'>
                    <FileCode size={12} className='text-emerald-400' />
                    <span>info.csv</span>
                  </div>

                  <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800/80 text-[10px] font-mono text-slate-400 shadow-sm'>
                    <ShieldAlert size={12} className='text-purple-400' />
                    <span>Application Binaries (.apk / .zip)</span>
                  </div>

                  <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800/80 text-[10px] font-mono text-slate-400 shadow-sm'>
                    <span className='w-1.5 h-1.5 rounded-full bg-amber-400'></span>
                    <span>demo.gif (Hero visual)</span>
                  </div>

                  <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-950 border border-gray-800/80 text-[10px] font-mono text-slate-400 shadow-sm'>
                    <span className='w-1.5 h-1.5 rounded-full bg-blue-400'></span>
                    <span>/ScreenShots (Folder cluster)</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Project Inventory System Console */}
          <section className='bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-xl'>
            <div className='border-b border-gray-800 bg-gray-900/50 px-6 py-4 flex items-center justify-between'>
              <h2 className='text-sm font-mono font-bold tracking-wider text-gray-400 uppercase flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                Cloud Sync Inventory
              </h2>
              <span className='text-xs font-mono text-gray-500'>
                {projects.length} Total Records Loaded
              </span>
            </div>

            {fetchingProjects ? (
              <div className='p-12 text-center text-sm font-mono text-gray-500'>
                Querying database registry...
              </div>
            ) : projects.length === 0 ? (
              <div className='p-12 text-center text-sm font-mono text-gray-500'>
                No project records detected in deployment environment database.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-left border-collapse font-sans'>
                  <thead>
                    <tr className='border-b border-gray-800 bg-gray-900/30 text-xs font-mono text-gray-400'>
                      <th className='p-4 font-semibold'>Project Title</th>
                      <th className='p-4 font-semibold'>Type</th>
                      <th className='p-4 font-semibold'>Tech Stack</th>
                      <th className='p-4 font-semibold'>Target Distribution</th>
                    </tr>
                  </thead>
                  <tbody className='text-sm divide-y divide-gray-900'>
                    {projects.map(project => (
                      <tr key={project.id} className='border-b border-gray-800'>
                        <td className='p-4 text-white font-medium'>
                          {project.title}
                        </td>
                        <td className='p-4'>
                          <div className='flex flex-wrap gap-1 max-w-xs'>
                            {/* Map Tech Stack */}
                            {project.tech_stack?.map((tech, idx) => (
                              <span
                                key={idx}
                                className='text-[10px] bg-blue-950/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/30'
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className='p-4'>
                          <div className='flex flex-wrap gap-1 max-w-xs'>
                            {/* Map Architecture Tags */}
                            {project.architecture_tags?.map((arch, idx) => (
                              <span
                                key={idx}
                                className='text-[10px] bg-purple-950/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900/30'
                              >
                                {arch}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className='p-4 font-mono text-xs text-gray-400'>
                          <a
                            href={project.download_url}
                            target='_blank'
                            rel='noreferrer'
                            className='block hover:underline'
                          >
                            Binary ↗
                          </a>
                          <a
                            href={project.gif_url}
                            target='_blank'
                            rel='noreferrer'
                            className='block hover:underline'
                          >
                            GIF ↗
                          </a>
                        </td>
                        ; ;
                        <td className='p-4'>
                          <div className='flex flex-col gap-1 text-xs'>
                            <span>
                              {hasAsset(
                                'installers',
                                project.title,
                                project.binary_filename
                              )
                                ? '✅'
                                : '❌'}{' '}
                              Binary
                            </span>
                            <span>
                              {hasAsset(
                                'visuals',
                                project.title,
                                project.gif_filename
                              )
                                ? '✅'
                                : '❌'}{' '}
                              GIF
                            </span>
                            <span>
                              {getScreenshotCount(project.title) === 4
                                ? '✅'
                                : '❌'}{' '}
                              ({getScreenshotCount(project.title)}/4)
                              Screenshots
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    )
  })
}
