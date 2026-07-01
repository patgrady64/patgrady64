import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProjectCarousel ({
  images,
  onImageClick,
  onImageChange
}) {
  const [index, setIndex] = useState(0)

  const next = e => {
    e.stopPropagation()

    setIndex(prev => {
      const newIndex = prev === images.length - 1 ? 0 : prev + 1
      onImageChange?.(images[newIndex])
      return newIndex
    })
  }

  const prev = e => {
    e.stopPropagation()

    setIndex(prev => {
      const newIndex = prev === 0 ? images.length - 1 : prev - 1
      onImageChange?.(images[newIndex])
      return newIndex
    })
  }

  return (
    <div className='relative h-full w-full overflow-hidden rounded-2xl bg-gray-900 flex items-center justify-center'>
      {' '}
      <img
        src={images[index]}
        onClick={() => onImageClick(images[index])}
        alt='Screenshot'
        className='max-h-full max-w-full object-contain'
      />
      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className='absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-emerald-600'
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className='absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-emerald-600'
      >
        <ChevronRight size={16} />
      </button>
      {/* Dots Indicator */}
      <div className='absolute bottom-2 left-0 right-0 flex justify-center gap-1'>
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i === index ? 'bg-emerald-400' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
