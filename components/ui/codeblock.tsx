// Referenced from Vercel's AI Chatbot and modified to fit the needs of this project
// https://github.com/vercel/ai-chatbot/blob/c2757f87f986b7f15fdf75c4c89cb2219745c53f/components/ui/codeblock.tsx

'use client'

import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { generateId } from 'ai'
import { Check, Copy, Download } from 'lucide-react'

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

import { Button } from '@/components/ui/button'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateId()}${fileExtension}`
    const fileName = window.prompt('Enter file name', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  return (
    <div className="relative w-full font-sans codeblock bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700 shadow-lg">
      <div className="flex items-center justify-between w-full px-3 sm:px-6 py-2 pr-2 sm:pr-4 bg-gradient-to-r from-neutral-800 to-neutral-700 text-zinc-100 border-b border-neutral-600">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-300 hidden sm:inline">
            {language}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-300 sm:hidden">
            {language.substring(0, 4)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            className="focus-visible:ring-1 hover:bg-neutral-600 h-7 w-7 sm:h-8 sm:w-8"
            onClick={downloadAsFile}
            size="icon"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-xs focus-visible:ring-1 focus-visible:ring-offset-0 hover:bg-neutral-600 h-7 w-7 sm:h-8 sm:w-8"
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={coldarkDark}
          PreTag="div"
          showLineNumbers
          customStyle={{
            margin: 0,
            width: '100%',
            background: 'transparent',
            padding: '1rem 0.75rem',
            fontSize: '0.8rem',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
          lineNumberStyle={{
            userSelect: 'none',
            minWidth: '2.5rem',
            paddingRight: '1rem',
            color: '#6b7280',
            fontSize: '0.75rem'
          }}
          codeTagProps={{
            style: {
              fontSize: '0.8rem',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              lineHeight: 1.5
            }
          }}
          wrapLongLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
