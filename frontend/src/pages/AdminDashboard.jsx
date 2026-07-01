import React, { useState, useEffect } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UploadCloud, LogOut, Terminal, ArrowLeft } from 'lucide-react'

export default function AdminDashboard () {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      activeTask.type === 'upload' &&
      currentLocation.pathname !== nextLocation.pathname
  )

  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [fetchingProjects, setFetchingProjects] = useState(false)
  const [activeTask, setActiveTask] = useState({
    type: null,
    progress: 0,
    message: ''
  })

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
      setRegistry(rawData)
    } catch (err) {
      console.error('Failed to sync registry:', err)
    } finally {
      setFetchingProjects(false)
    }
  }

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

  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async e => {
    e.preventDefault()
    e.stopPropagation()
    if (activeTask.type) return

    setActiveTask({
      type: 'upload',
      progress: 0,
      message: 'Preparing upload...'
    })
    setError(null)

    try {
      const allFiles = [] // Collect all file objects here

      // Updated traverseDirectory to push files into allFiles array
      const traverseDirectory = entry => {
        return new Promise(resolve => {
          if (entry.isFile) {
            entry.file(file => {
              allFiles.push(file)
              resolve()
            })
          } else if (entry.isDirectory) {
            const dirReader = entry.createReader()
            dirReader.readEntries(async entries => {
              await Promise.all(entries.map(e => traverseDirectory(e)))
              resolve()
            })
          }
        })
      }

      // Gather items
      const items = e.dataTransfer.items
      const promises = []
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry
          ? items[i].webkitGetAsEntry()
          : null
        if (entry) promises.push(traverseDirectory(entry))
      }
      await Promise.all(promises)

      // CALL THE SHARED FUNCTION
      await processUploadedFiles(allFiles)
    } catch (err) {
      setError(err.message)
    } finally {
      setActiveTask({ type: null, progress: 0, message: '' })
    }
  }

  const handleFolderSelect = async fileList => {
    if (activeTask.type) return
    setActiveTask({ type: 'upload', progress: 0, message: 'Processing...' })
    setError(null)

    try {
      await processUploadedFiles(Array.from(fileList))
    } catch (err) {
      setError(err.message)
    } finally {
      setActiveTask({ type: null, progress: 0, message: '' })
    }
  }

  const processUploadedFiles = async filesArray => {
    console.log("STEP 1 REACHED")
    const formData = new FormData()

    // 1. Find CSV
    const infoCsvFile = filesArray.find(f => f.name === 'info.csv')

    if (!infoCsvFile) {
      throw new Error('Missing info.csv')
    }

    // 2. Read CSV as TEXT (NOT parsing logic)
    const csvText = await infoCsvFile.text()

    // 3. Send manifest as raw text
    formData.append('manifest', csvText)

    // 4. Send all other files blindly
    filesArray.forEach(file => {
      if (file.name === 'info.csv') return
      formData.append('files', file)
    })

    console.log('CSV FILE:', infoCsvFile)
    console.log('CSV TEXT:', csvText)

    // 5. Send to backend
    console.log("🔥 ABOUT TO UPLOAD TO BACKEND")
    console.log("STEP 2 ABOUT TO FETCH")
    await fetch('http://localhost:5000/api/admin/sync', {
      method: 'POST',
      body: formData
    })

    await fetchRegistry()
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

  useEffect(() => {
    fetchRegistry()
  }, [session])

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
      if (activeTask.type === 'upload') {
        e.preventDefault()
        e.returnValue =
          'An upload is in progress. If you refresh, the upload will be cancelled.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [activeTask.type])

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
      }/api/admin/sync`

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
                  binaries, project demos, and cross-platform video assets.
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
                        {item.type === 'YouTube' && item.metadata?.platform}
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
