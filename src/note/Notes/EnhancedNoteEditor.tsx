import { useNotes } from "../../contexts/NotesContext";
import React, { useCallback, useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { ArrowLeft, Download, Printer, CloudOff, RefreshCw } from 'lucide-react'

import RichTextEditor, { BaseKit } from 'reactjs-tiptap-editor'
import {
  BubbleMenuTwitter,
  BubbleMenuKatex,
  BubbleMenuExcalidraw,
  BubbleMenuMermaid,
  BubbleMenuDrawer
} from 'reactjs-tiptap-editor/bubble-extra'

import { Attachment } from 'reactjs-tiptap-editor/attachment'
import { Blockquote } from 'reactjs-tiptap-editor/blockquote'
import { Bold } from 'reactjs-tiptap-editor/bold'
import { BulletList } from 'reactjs-tiptap-editor/bulletlist'
import { Clear } from 'reactjs-tiptap-editor/clear'
import { Code } from 'reactjs-tiptap-editor/code'
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock'
import { Color } from 'reactjs-tiptap-editor/color'
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn'
import { Emoji } from 'reactjs-tiptap-editor/emoji'
import { ExportPdf } from 'reactjs-tiptap-editor/exportpdf'
import { ExportWord } from 'reactjs-tiptap-editor/exportword'
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily'
import { FontSize } from 'reactjs-tiptap-editor/fontsize'
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter'
import { Heading } from 'reactjs-tiptap-editor/heading'
import { Highlight } from 'reactjs-tiptap-editor/highlight'
import { History } from 'reactjs-tiptap-editor/history'
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'
import { Iframe } from 'reactjs-tiptap-editor/iframe'
import { Image } from 'reactjs-tiptap-editor/image'
import { ImageGif } from 'reactjs-tiptap-editor/imagegif'
import { ImportWord } from 'reactjs-tiptap-editor/importword'
import { Indent } from 'reactjs-tiptap-editor/indent'
import { Italic } from 'reactjs-tiptap-editor/italic'
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'
import { Link } from 'reactjs-tiptap-editor/link'
import { Mention } from 'reactjs-tiptap-editor/mention'
import { MoreMark } from 'reactjs-tiptap-editor/moremark'
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist'
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace'
import { SlashCommand } from 'reactjs-tiptap-editor/slashcommand'
import { Strike } from 'reactjs-tiptap-editor/strike'
import { Table } from 'reactjs-tiptap-editor/table'
import { TableOfContents } from 'reactjs-tiptap-editor/tableofcontent'
import { TaskList } from 'reactjs-tiptap-editor/tasklist'
import { TextAlign } from 'reactjs-tiptap-editor/textalign'
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline'
import { Video } from 'reactjs-tiptap-editor/video'
import { TextDirection } from 'reactjs-tiptap-editor/textdirection'
import { Katex } from 'reactjs-tiptap-editor/katex'
import { Drawer } from 'reactjs-tiptap-editor/drawer'
import { Excalidraw } from 'reactjs-tiptap-editor/excalidraw'
import { Twitter } from 'reactjs-tiptap-editor/twitter'
import { Mermaid } from 'reactjs-tiptap-editor/mermaid'
import { exportNoteToPdf } from '../../utils/exportToPdf'

import 'reactjs-tiptap-editor/style.css'
import 'prism-code-editor-lightweight/layout.css'
import "prism-code-editor-lightweight/themes/github-dark.css"
import 'katex/dist/katex.min.css'
import 'easydrawer/styles.css'
import 'react-image-crop/dist/ReactCrop.css'
import "@excalidraw/excalidraw/index.css"
import type { Note } from './NotesPage'

type Props = {
  note: Note
  onChange: (note: Note) => void
  onSave: () => void
  onBack: () => void
}

function convertBase64ToBlob(base64: string) {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
    characterCount: {
      limit: 150_000,
    },
  }),
  History,
  SearchAndReplace,
  TableOfContents,
  FormatPainter.configure({ spacer: true }),
  Clear,
  FontFamily,
  Heading.configure({ spacer: true }),
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  Color.configure({ spacer: true }),
  Highlight,
  BulletList,
  OrderedList,
  TextAlign.configure({ types: ['heading', 'paragraph'], spacer: true }),
  Indent,
  LineHeight,
  TaskList.configure({
    spacer: true,
    taskItem: {
      nested: true,
    },
  }),
  Link,
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.onerror = () => resolve('')
        reader.readAsDataURL(files)
      })
    },
    HTMLAttributes: {
      class: 'enhanced-editor-image',
    },
  }),
  Video.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(files)
      })
    },
  }),
  ImageGif.configure({
    GIPHY_API_KEY: (import.meta as any).env?.VITE_GIPHY_API_KEY as string,
  }),
  Blockquote,
  SlashCommand,
  HorizontalRule,
  Code.configure({
    toolbar: false,
  }),
  CodeBlock,
  ColumnActionButton,
  Table,
  Iframe,
  ExportPdf.configure({ spacer: true }),
  ImportWord.configure({
    upload: (files: File[]) => {
      return Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              src: reader.result as string,
              alt: file.name,
            })
          }
          reader.readAsDataURL(file)
        })
      }))
    },
  }),
  ExportWord,
  TextDirection,
  Mention,
  Attachment.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Katex,
  Excalidraw,
  Mermaid.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Drawer.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Twitter,
]

function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout
  return function (...args: any[]) {
    clearTimeout(timeout)
    // @ts-ignore
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export default function EnhancedNoteEditor({ note, onChange, onSave, onBack }: Props) {
  const { syncStatus } = useNotes();
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState(note.content || '')
  const [title, setTitle] = useState(note.title || '')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [newTag, setNewTag] = useState('')

  const processContent = (content: string, isInitialLoad = false) => {
    if (!content) return ''
    if (!isInitialLoad && (!content.includes('<img') || content.includes('enhanced-editor-image'))) {
      return content
    }
    let processedContent = content.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (!attrs.includes('class=')) {
        return `<img${attrs} class="enhanced-editor-image">`
      }
      return match
    })
    return processedContent
  }

  useEffect(() => {
    const newContent = note.content || ''
    const processedContent = processContent(newContent, true) 
    setContent(processedContent)
    setTitle(note.title || '')
    setTags(note.tags || [])
  }, [note.id, note.title, note.tags, note.content])

  const onValueChange = useCallback(
    debounce((value: any) => {
      setContent(value)
      onChange({
        ...note,
        content: value,
        title,
        tags,
        updatedAt: Date.now()
      })
    }, 100),
    [note, title, tags, onChange]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    onChange({
      ...note,
      title: newTitle,
      content,
      tags,
      updatedAt: Date.now()
    })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()]
      setTags(newTags)
      setNewTag('')
      onChange({
        ...note,
        title,
        content,
        tags: newTags,
        updatedAt: Date.now()
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onChange({
      ...note,
      title,
      content,
      tags: newTags,
      updatedAt: Date.now()
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleExportPdf = async () => {
    try {
      await exportNoteToPdf(title, content, tags, `${title || 'note'}.pdf`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handlePrint = () => {
    try {
      const title = note.title || 'Untitled Note'
      // Get the latest content from Quill
      const currentContent = content || note.content
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow popups to print this note.')
        return
      }


      // Create the print content with comprehensive styling
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            /* Reset and base styles */
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              font-size: 14px;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              color: #2c3e50;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              font-weight: bold;
            }
            h1 { font-size: 2em; border-bottom: 2px solid #3498db; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            h4 { font-size: 1.1em; }
            h5 { font-size: 1em; }
            h6 { font-size: 0.9em; }
            
            p { 
              margin-bottom: 1em; 
              margin-top: 0;
            }
            
            ul, ol { 
              margin-bottom: 1em; 
              padding-left: 2em; 
            }
            
            li {
              margin-bottom: 0.5em;
            }
            
            blockquote {
              border-left: 4px solid #3498db;
              margin: 1em 0;
              padding-left: 1em;
              color: #666;
              font-style: italic;
            }
            
            /* Code styling */
            code {
              background-color: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
              font-size: 0.9em;
            }
            
            pre {
              background-color: #f4f4f4;
              padding: 1em;
              border-radius: 5px;
              overflow-x: auto;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
              font-size: 0.9em;
              line-height: 1.4;
            }
            
            pre code {
              background: none;
              padding: 0;
            }
            
            /* Image styling */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1em auto;
              border-radius: 4px;
              page-break-inside: avoid;
            }
            
            /* PDF page styling - preserve exact appearance */
            .pdf-page {
              margin-bottom: 20px;
              text-align: center;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            
            .pdf-page img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0;
              border-radius: 0;
            }
            
            .pdf-page div {
              background: #f8f9fa;
              padding: 8px;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
            }
            
            /* Quill-specific styles */
            .ql-editor {
              font-family: inherit;
              line-height: inherit;
              color: inherit;
            }
            
            .ql-editor p {
              margin-bottom: 1em;
            }
            
            .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            
            .ql-editor ul, .ql-editor ol {
              margin-bottom: 1em;
              padding-left: 2em;
            }
            
            .ql-editor blockquote {
              border-left: 4px solid #3498db;
              margin: 1em 0;
              padding-left: 1em;
              color: #666;
              font-style: italic;
            }
            
            .ql-editor code {
              background-color: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
            }
            
            .ql-editor pre {
              background-color: #f4f4f4;
              padding: 1em;
              border-radius: 5px;
              overflow-x: auto;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
            }
            
            /* Text formatting */
            strong, b {
              font-weight: bold;
            }
            
            em, i {
              font-style: italic;
            }
            
            u {
              text-decoration: underline;
            }
            
            s, strike {
              text-decoration: line-through;
            }
            
            /* Lists */
            ul {
              list-style-type: disc;
            }
            
            ol {
              list-style-type: decimal;
            }
            
            /* Links */
            a {
              color: #3498db;
              text-decoration: underline;
            }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            
            /* Print-specific styles */
            @media print {
              body { 
                margin: 0; 
                padding: 15px; 
                font-size: 12px;
              }
              .no-print { display: none; }
              
              /* Preserve images exactly */
              img {
                max-width: 100% !important;
                height: auto !important;
                page-break-inside: avoid !important;
              }
              
              /* Preserve PDF pages exactly */
              .pdf-page {
                page-break-inside: avoid !important;
                margin-bottom: 15px !important;
                box-shadow: none !important;
                border: 1px solid #000 !important;
              }
              
              .pdf-page img {
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
              }
              
              .pdf-page div {
                background: #f0f0f0 !important;
                font-size: 10px !important;
                padding: 4px !important;
              }
              
              h1 { font-size: 1.8em; }
              h2 { font-size: 1.4em; }
              h3 { font-size: 1.2em; }
              
              /* Ensure content doesn't break awkwardly */
              p, div, span {
                orphans: 3;
                widows: 3;
              }
              
              /* Preserve all inline styles in print */
              *[style] {
                /* Allow all inline styles to be preserved */
              }
              
              /* Preserve text alignment in print */
              *[style*="text-align: center"] {
                text-align: center !important;
              }
              
              *[style*="text-align: right"] {
                text-align: right !important;
              }
              
              *[style*="text-align: left"] {
                text-align: left !important;
              }
              
              /* Preserve colors in print (if printer supports color) */
              *[style*="color"] {
                color: inherit !important;
              }
              
              /* Preserve font styles in print */
              *[style*="font-family"] {
                font-family: inherit !important;
              }
              
              *[style*="font-size"] {
                font-size: inherit !important;
              }
              
              *[style*="font-weight"] {
                font-weight: inherit !important;
              }
            }
            
            /* Preserve Quill formatting - but allow colors and styles */
            .ql-editor * {
              /* Don't override colors and backgrounds - preserve them */
            }
            
            /* Preserve text alignment */
            .ql-editor [style*="text-align"] {
              text-align: inherit !important;
            }
            
            /* Preserve colors */
            .ql-editor [style*="color"] {
              color: inherit !important;
            }
            
            /* Preserve background colors */
            .ql-editor [style*="background-color"] {
              background-color: inherit !important;
            }
            
            /* Preserve font families */
            .ql-editor [style*="font-family"] {
              font-family: inherit !important;
            }
            
            /* Preserve font sizes */
            .ql-editor [style*="font-size"] {
              font-size: inherit !important;
            }
            
            /* Ensure proper spacing */
            .ql-editor > *:first-child {
              margin-top: 0;
            }
            
            .ql-editor > *:last-child {
              margin-bottom: 0;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="ql-editor content">
            ${currentContent}
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Print failed:', error)
      alert('Failed to print note. Please try again.')
    }
  }

    const textContent = note.content ? note.content.replace(/<[^>]*>/g, '').trim() : '';
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-full relative pb-32">
      {/* Minimalist Notion / Apple style top bar */}
      <div className="sticky top-14 z-30 w-full bg-surface/85 backdrop-blur-md border-b border-border-hairline/60 transition-colors">
        <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 h-12 flex items-center justify-between text-xs">
          {/* Breadcrumb: Notes / Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors py-1 px-2 -ml-2 rounded hover:bg-zinc-800/40"
              title="Back to notes"
            >
              <ArrowLeft size={14} />
              <span className="font-medium text-xs">Notes</span>
            </button>
            <span className="text-zinc-600 select-none text-xs">/</span>
            <span className="text-zinc-400 truncate max-w-[200px] sm:max-w-md font-normal text-xs">
              {title || 'Untitled'}
            </span>
          </div>

          {/* Clean, borderless actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={handleExportPdf} 
              title="Export as PDF"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors text-xs font-normal" 
              type="button"
            >
              <Download size={13} strokeWidth={1.75} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button 
              onClick={handlePrint} 
              title="Print document"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors text-xs font-normal" 
              type="button"
            >
              <Printer size={13} strokeWidth={1.75} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button 
              onClick={onSave} 
              className="ml-1 px-3 py-1 rounded font-medium text-zinc-200 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors text-xs active:scale-[0.98]" 
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Document Master Canvas */}
      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 pt-space-xl flex flex-col gap-space-xl">
        <section className="flex flex-col gap-space-md">
          {/* Title Input */}
          <input
            className="w-full mb-3 px-3 py-2 bg-transparent border-none text-on-surface font-display-hero text-display-hero tracking-tight outline-none focus:ring-0 selection:bg-primary-fixed"
            placeholder="Document Title"
            value={title}
            onChange={handleTitleChange}
          />
          
          {/* Tags Section */}
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15 font-label-sm text-label-sm shadow-xs"
              >
                <span className="text-primary font-code-sm text-code-sm">#</span>{tag}
                <button 
                  className="text-error hover:text-error/80 ml-1" 
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-text-tertiary">
              <input
                className="bg-transparent border-none outline-none font-label-sm text-label-sm w-24 placeholder:text-text-tertiary"
                placeholder="Add Tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={addTag} 
                className="text-on-surface-variant hover:text-on-surface"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* Editor Container */}
        <div className="enhanced-editor-container w-full min-h-[60vh]">
          <RichTextEditor
            key={`editor-${note.id}`}
            output="html"
            content={content}
            onChangeContent={onValueChange}
            extensions={extensions}
            dark={resolvedTheme === 'dark'}
            disabled={false}
            bubbleMenu={{
              render({ extensionsNames, editor, disabled }: any, bubbleDefaultDom: any) {
                return <>
                  {bubbleDefaultDom}
                  {extensionsNames.includes('twitter') ? <BubbleMenuTwitter disabled={disabled} editor={editor} key="twitter" /> : null}
                  {extensionsNames.includes('katex') ? <BubbleMenuKatex disabled={disabled} editor={editor} key="katex" /> : null}
                  {extensionsNames.includes('excalidraw') ? <BubbleMenuExcalidraw disabled={disabled} editor={editor} key="excalidraw" /> : null}
                  {extensionsNames.includes('mermaid') ? <BubbleMenuMermaid disabled={disabled} editor={editor} key="mermaid" /> : null}
                  {extensionsNames.includes('drawer') ? <BubbleMenuDrawer disabled={disabled} editor={editor} key="drawer" /> : null}
                </>
              },
            }}
          />
        </div>
      </div>

      {/* Quiet document footer */}
      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 pt-8 pb-16 flex items-center justify-between text-xs text-zinc-500 border-t border-border-hairline/40">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span className="text-zinc-700 select-none">•</span>
          <span>{readTime} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          {syncStatus === 'syncing' ? (
            <span className="text-primary flex items-center gap-1">
              <RefreshCw size={11} className="animate-spin" /> Syncing...
            </span>
          ) : syncStatus === 'error' ? (
            <span className="text-error flex items-center gap-1">
              <CloudOff size={11} /> Sync failed
            </span>
          ) : (
            <span className="text-zinc-500 font-normal">Saved</span>
          )}
        </div>
      </div>
    </div>
  )
}
