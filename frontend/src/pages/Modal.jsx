import React from 'react'

export default function Modal ({ isOpen, onClose, title, content, type }) {
  if (!isOpen) return null

  console.log('Modal Type:', type)
  console.log('Modal Content:', content)

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80'
      onClick={onClose}
    >
      <div
        className='bg-gray-900 p-6 rounded-2xl max-w-4xl w-full'
        onClick={e => e.stopPropagation()}
      >
        <h2 className='text-xl font-bold mb-4 text-white'>{title}</h2>

        {/* Force check if type is specifically 'image' */}
        {type === 'image' ? (
          <img
            src={content}
            alt={title}
            // max-h-[80vh] ensures the image never exceeds 80% of the screen height
            // object-contain ensures it stays within those bounds without cropping
            className='w-full max-h-[80vh] object-contain rounded-lg'
          />
        ) : (
          <p className='text-gray-300 whitespace-pre-line'>{content}</p>
        )}

        <button onClick={onClose} className='mt-4 text-emerald-400 underline'>
          Close
        </button>
      </div>
    </div>
  )
}
