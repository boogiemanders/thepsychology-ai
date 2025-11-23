'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Paperclip, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FeedbackInputBoxProps {
  onSend: (message: string, file?: File | null) => Promise<void> | void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

const supportStyles = `
  *:focus-visible {
    outline-offset: 0 !important;
    --ring-offset: 0 !important;
  }
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  textarea::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 3px;
  }
  textarea::-webkit-scrollbar-thumb:hover {
    background-color: #555555;
  }
`

export function FeedbackInputBox({
  onSend,
  isLoading = false,
  placeholder = 'Type your feedback here...',
  className,
}: FeedbackInputBoxProps) {
  const [value, setValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const styleElement = document.createElement('style')
    styleElement.setAttribute('data-feedback-input-box', '')
    styleElement.innerText = supportStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const hasContent = value.trim().length > 0 || !!file

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const processFile = useCallback(
    (incomingFile: File) => {
      if (!incomingFile.type.startsWith('image/')) {
        setError('Only image files are allowed.')
        return
      }
      const maxSizeBytes = 10 * 1024 * 1024
      if (incomingFile.size > maxSizeBytes) {
        setError('Image must be 10MB or smaller.')
        return
      }
      setError(null)
      setFile(incomingFile)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(incomingFile))
    },
    [previewUrl]
  )

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      processFile(fileList[0])
    },
    [processFile]
  )

  const handleSubmit = useCallback(async () => {
    if (!hasContent || isLoading) return

    try {
      await onSend(value.trim(), file)
      setValue('')
      setFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } catch (err) {
      console.error('Feedback submission failed:', err)
    }
  }, [onSend, value, file, hasContent, isLoading, previewUrl])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const pastedFile = item.getAsFile()
        if (pastedFile) {
          event.preventDefault()
          processFile(pastedFile)
          break
        }
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    const droppedFiles = event.dataTransfer?.files
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0])
    }
  }

  const borderClasses = useMemo(
    () =>
      cn(
        'rounded-3xl border border-[#444444] bg-[#1F2023] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-colors duration-300',
        isDragging && 'border-white/40 bg-white/5',
        isLoading && 'opacity-60 cursor-not-allowed',
        className
      ),
    [isDragging, isLoading, className]
  )

  return (
    <div
      className={borderClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {file && previewUrl && (
          <motion.div
            key={previewUrl}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="mb-3"
          >
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt={file.name}
                className="h-20 w-20 rounded-2xl object-cover border border-white/10"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                  }
                }}
                className="absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
                aria-label="Remove screenshot"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className={cn(
          'flex w-full min-h-[48px] resize-none rounded-2xl bg-transparent text-base leading-relaxed text-gray-100 placeholder:text-gray-500',
          'px-2 py-1',
          'border-none outline-none focus-visible:ring-0',
          'max-h-[240px] overflow-y-auto',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      />

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-[#9CA3AF] transition-colors',
            'hover:bg-gray-600/30 hover:text-[#D1D5DB]'
          )}
          onClick={() => uploadInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Attach screenshot"
        >
          <Paperclip className="h-5 w-5" />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => {
              handleFiles(event.target.files)
              if (event.target) {
                event.target.value = ''
              }
            }}
          />
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !hasContent}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
            hasContent && !isLoading
              ? 'bg-white text-[#1F2023] hover:bg-white/90'
              : 'bg-gray-600/30 text-gray-400 cursor-not-allowed'
          )}
          aria-label="Send feedback"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
