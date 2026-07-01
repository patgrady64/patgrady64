import React, { useState, useEffect } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  UploadCloud,
  LogOut,
  Terminal,
  ShieldAlert,
  FileCode,
  ArrowLeft
} from 'lucide-react'

export default function AdminDashboard () {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      uploading && currentLocation.pathname !== nextLocation.pathname
  )

  const hasAsset = (folder, project, name) => {
    const found = existingFiles.some(f => {
      const isMatch =
        f.folder === folder && f.project === project && f.name === name
      if (!isMatch && f.project === project && f.folder === folder) {
        console.log(
          `Mismatch! Expected: "${name}", Found in storage: "${f.name}"`
        )
      }
      return isMatch
    })
    return found
  }

  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [fetchingProjects, setFetchingProjects] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTask, setActiveTask] = useState({
    type: null,
    progress: 0,
    message: ''
  })

  const [projects, setProjects] = useState([])
  const [expandedProjects, setExpandedProjects] = useState({})
  const [existingFiles, setExistingFiles] = useState([])

  const [statusMessage, setStatusMessage] = useState('')

  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = React.useRef(null)

  // Change your state definition
  const [registry, setRegistry] = useState([])

  // Update your fetch logic to aggregate data
  const fetchRegistry = async () => {
    setFetchingProjects(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/check-all-assets`
      )
      const rawData = await res.json()

      // Transform flat file list into unique project objects
      const projectMap = new Map()
      rawData.forEach(file => {
        if (!projectMap.has(file.project)) {
          projectMap.set(file.project, {
            id: file.project, // Using project name as ID if no UUID exists
            type: 'Project',
            title: file.project,
            status: 'Synced',
            metadata: { tech: [] } // Initialize structure
          })
        }
      })

      setRegistry(Array.from(projectMap.values()))
    } catch (err) {
      console.error('Failed to sync registry:', err)
    } finally {
      setFetchingProjects(false)
    }
  }

  const getScreenshotCount = projectTitle => {
    const files = existingFiles.filter(
      f => f.folder === 'screenshots' && f.project === projectTitle
    )
    console.log(`Found ${files.length} screenshots for ${projectTitle}:`, files)
    return files.length
  }

  const groupedFiles = React.useMemo(() => {
    // 1. Provide {} as the initial value to prevent "empty array" errors
    return existingFiles.reduce((acc, file) => {
      // 2. Safely access the properties returned by your Flask backend (app.py)
      const { project, folder, name } = file

      if (!project) return acc

      if (!acc[project]) {
        acc[project] = []
      }

      acc[project].push({ folder, name })
      return acc
    }, {}) // <--- This empty object is mandatory
  }, [existingFiles])

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

  const handleDelete = async id => {
    if (!window.confirm('Permanently delete this project and all assets?'))
      return

    setActiveTask({
      type: 'delete',
      progress: 0,
      message: 'Initiating deletion...'
    })

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/delete/${id}`,
        {
          method: 'DELETE'
        }
      )

      if (res.ok) {
        // 1. Refresh the inventory list from the database
        await fetchRegistry()

        // 2. Clear the active task after a brief moment to show "Done"
        setTimeout(
          () => setActiveTask({ type: null, progress: 0, message: '' }),
          1000
        )
      } else {
        throw new Error('Server rejected deletion')
      }
    } catch (err) {
      console.error('Delete operation failed:', err)
      setActiveTask({ type: null, progress: 0, message: '' })
    }
  }

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

  useEffect(() => {
    fetchRegistry()
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

    // 1. Check activeTask instead of uploading
    if (activeTask.type) return

    const items = e.dataTransfer.items
    if (!items || items.length === 0) return

    // 2. Set the active task
    setActiveTask({
      type: 'upload',
      progress: 0,
      message: 'Preparing upload...'
    })
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
                if (file.name === 'info.csv') {
                  formData.append('info_csv', file)
                } else if (
                  file.name.endsWith('.apk') ||
                  file.name.endsWith('.exe')
                ) {
                  formData.append('binary_filename', file)
                } else if (file.name.endsWith('.gif')) {
                  formData.append('gif_filename', file)
                } else {
                  formData.append(file.webkitRelativePath || file.name, file)
                }
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
        throw new Error("Missing mandatory 'info.csv' configuration file.")
      }

      const result = await streamPayloadToPipeline(formData)
      await new Promise(resolve => setTimeout(resolve, 2000))
      fetchRegistry()
    } catch (err) {
      console.error('Drop Upload Error:', err)
      setError(err.message)
    } finally {
      // 3. Clear task instead of setUploading(false)
      setActiveTask({ type: null, progress: 0, message: '' })
    }
  }

  const handleFolderSelect = async fileList => {
    if (activeTask.type) return

    setActiveTask({
      type: 'upload',
      progress: 0,
      message: 'Processing files...'
    })

    setError(null)

    try {
      const files = Array.from(fileList)

      const infoCsvFile = files.find(file => file.name === 'info.csv')

      if (!infoCsvFile) {
        throw new Error('Missing mandatory info.csv')
      }

      // Read the CSV
      const csvText = await infoCsvFile.text()

      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      const values = lines[1].split(',').map(v => v.trim())

      const binaryName = values[headers.indexOf('binary_filename')] || ''

      const gifName = values[headers.indexOf('gif_filename')] || ''

      const formData = new FormData()

      // Always include info.csv
      formData.append('info_csv', infoCsvFile)

      // Append all remaining files
      files.forEach(file => {
        if (file.name === 'info.csv') return

        const baseName = file.name.split('/').pop().split('\\').pop()

        if (baseName === binaryName) {
          formData.append('binary_filename', file)
        } else if (baseName === gifName) {
          formData.append('gif_filename', file)
        } else {
          // screenshots and everything else
          formData.append(baseName, file)
        }
      })

      console.log('Uploading:')
      for (const [key, value] of formData.entries()) {
        console.log(key, value.name)
      }

      await streamPayloadToPipeline(formData)

      await fetchRegistry()
    } catch (err) {
      console.error('Selection Upload Error:', err)
      setError(err.message)
    } finally {
      setActiveTask({
        type: null,
        progress: 0,
        message: ''
      })
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        fetchRegistry() // Re-fetch the registry whenever a change occurs in Supabase
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = e => {
      if (uploading) {
        e.preventDefault()
        e.returnValue =
          'An upload is in progress. If you refresh, the upload will be cancelled.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploading])

  // Add this effect to poll for status updates
  useEffect(() => {
    let interval
    if (uploading) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/admin/sync-status`
          )
          const data = await res.json()

          // This updates the variables so the UI reacts
          setUploadProgress(data.percent)
          setStatusMessage(data.status)

          // Stop polling if the process is finished
          if (data.percent >= 100) clearInterval(interval)
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 1000) // Poll every second
    }
    return () => clearInterval(interval)
  }, [uploading])

  useEffect(() => {
    let interval
    if (activeTask.type) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/admin/sync-status`
          )
          const data = await res.json()
          setActiveTask(prev => ({
            ...prev,
            progress: data.percent,
            message: data.status
          }))
          if (data.percent >= 100) {
            clearInterval(interval)
            setTimeout(
              () => setActiveTask({ type: null, progress: 0, message: '' }),
              1500
            )
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTask.type])

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
          // Update the activeTask state directly
          setActiveTask(prev => ({
            ...prev,
            progress: percentage,
            message: `Uploading: ${percentage}%`
          }))
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
  return (
    <div className='min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-12'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header Console Row */}
        <header className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6'>
          <div>
            <Link
              to='/'
              className='flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-mono mb-4'
            >
              <ArrowLeft size={16} /> Back to Homepage
            </Link>
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
            onClick={() => fileInputRef.current?.click()}
            className='group relative bg-gradient-to-b from-gray-950/40 to-gray-950/80 border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 hover:border-emerald-500/40 cursor-pointer border-gray-800'
          >
            <input
              type='file'
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0)
                  handleFolderSelect(e.target.files)
              }}
              style={{ display: 'none' }}
              webkitdirectory=''
              directory=''
              multiple
            />

            <div className='relative z-10 max-w-lg mx-auto space-y-6'>
              <div className='text-center space-y-2'>
                <h2 className='text-lg font-bold text-white'>
                  System Ingestion Pipeline
                </h2>
                <p className='text-sm text-gray-400'>
                  Upload project directories or YouTube metadata manifests. The
                  system processes assets based on the definitions provided in
                  your{' '}
                  <span className='text-amber-400 font-mono'>info.csv</span>,
                  which governs the mapping for both software projects and video
                  content.
                </p>
              </div>

              {/* Unified Progress UI */}
              {activeTask.type && (
                <div className='w-full max-w-xs mx-auto bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800 p-0.5 mt-3'>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeTask.type === 'delete'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${activeTask.progress}%` }}
                  />
                </div>
              )}
              {activeTask.message && (
                <p className='text-center text-xs mt-2 text-gray-400 font-mono'>
                  {activeTask.message}
                </p>
              )}
              <div className='p-8 bg-gray-950 rounded-xl border border-gray-800 text-center shadow-lg'>
                <p className='text-sm font-bold text-gray-200 uppercase tracking-widest mb-4'>
                  Protocol Requirements
                </p>
                <p className='text-base text-gray-400 leading-relaxed max-w-md mx-auto'>
                  Ensure each upload contains a valid{' '}
                  <span className='font-mono text-emerald-400 font-bold'>
                    info.csv
                  </span>
                  . The pipeline dynamically routes files based on the CSV
                  schema, supporting multi-type ingestion including software
                  binaries, project visuals, and cross-platform video assets.
                </p>
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
              {registry.length} Total Records Loaded
            </span>
          </div>

          {fetchingProjects ? (
            <div className='p-12 text-center text-sm font-mono text-gray-500'>
              Querying database registry...
            </div>
          ) : registry.length === 0 ? (
            <div className='p-12 text-center text-sm font-mono text-gray-500'>
              No project records detected in deployment environment database.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse font-sans'>
                <thead>
                  <tr className='border-b border-gray-800 bg-gray-900/30 text-xs font-mono text-gray-400'>
                    <th className='p-4 font-semibold'>Type</th>
                    <th className='p-4 font-semibold'>Title</th>
                    <th className='p-4 font-semibold'>Metadata</th>
                    <th className='p-4 font-semibold'>Status</th>
                    <th className='p-4 font-semibold'>Actions</th>
                  </tr>
                </thead>

                <tbody className='text-sm divide-y divide-gray-900'>
                  {registry.map(item => (
                    <tr
                      key={item.id}
                      className='border-b border-gray-800 hover:bg-gray-900/20'
                    >
                      {/* 1. Type */}
                      <td className='p-4 text-xs uppercase font-bold text-gray-400'>
                        {item.type}
                      </td>

                      {/* 2. Title */}
                      <td className='p-4 font-semibold text-white'>
                        {item.title}
                      </td>

                      {/* 3. Metadata (Safely access) */}
                      <td className='p-4 text-xs text-blue-400'>
                        {item.type === 'Project' &&
                          item.metadata?.tech?.join(', ')}
                        {item.type === 'Video' && item.metadata?.platform}
                        {item.type === 'Book' && `ISBN: ${item.metadata?.isbn}`}
                      </td>

                      {/* 4. Status (Now correctly populated) */}
                      <td className='p-4 text-xs text-emerald-500'>
                        {item.status}
                      </td>

                      {/* 5. Delete Action */}
                      <td className='p-4'>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className='text-red-500'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {blocker.state === 'blocked' ? (
        <div className='upload-blocker-modal'>
          <div className='modal-content'>
            <p>
              An upload is in progress. If you leave now, the upload will be
              cancelled.
            </p>
            <button onClick={() => blocker.proceed()}>Leave Page</button>
            <button onClick={() => blocker.reset()}>Stay and Continue</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
