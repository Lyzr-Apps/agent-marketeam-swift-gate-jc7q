'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { useLyzrAgentEvents } from '@/lib/lyzrAgentEvents'
import { AgentActivityPanel } from '@/components/AgentActivityPanel'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineClock,
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineChevronRight,
  HiOutlineTrendingUp,
  HiOutlineTag,
  HiOutlinePencil,
  HiOutlineColorSwatch
} from 'react-icons/hi'

// ----- Constants -----

const CONTENT_AGENT_ID = '69939142b175ad1ab1aed346'
const GRAPHICS_AGENT_ID = '69939142b6bc6d320bbb0398'

const THEME_VARS: React.CSSProperties = {
  '--background': '30 40% 98%',
  '--foreground': '20 40% 10%',
  '--card': '30 40% 96%',
  '--card-foreground': '20 40% 10%',
  '--primary': '24 95% 53%',
  '--primary-foreground': '30 40% 98%',
  '--secondary': '30 35% 92%',
  '--secondary-foreground': '20 40% 15%',
  '--accent': '12 80% 50%',
  '--accent-foreground': '30 40% 98%',
  '--muted': '30 30% 90%',
  '--muted-foreground': '20 25% 45%',
  '--border': '30 35% 88%',
  '--input': '30 30% 80%',
  '--ring': '24 95% 53%',
  '--destructive': '0 84% 60%',
  '--radius': '0.875rem',
} as React.CSSProperties

const AGENTS = [
  { id: CONTENT_AGENT_ID, name: 'Content Orchestrator', purpose: 'SEO content generation and optimization' },
  { id: GRAPHICS_AGENT_ID, name: 'Graphics Generator', purpose: 'Marketing visuals and graphic generation' },
]

const LOADING_MESSAGES_CONTENT = [
  'Researching keywords and competitors...',
  'Analyzing search intent...',
  'Structuring content outline...',
  'Writing optimized content...',
  'Running SEO analysis...',
  'Finalizing article...',
]

const LOADING_MESSAGES_GRAPHICS = [
  'Interpreting your description...',
  'Composing visual elements...',
  'Generating graphic...',
  'Applying style refinements...',
]

// ----- Types -----

interface HistoryItem {
  id: string
  type: 'article' | 'optimization' | 'graphic'
  title: string
  content?: string
  imageUrl?: string
  seoScore?: number
  metaDescription?: string
  keywords?: string[]
  timestamp: string
}

interface ContentResult {
  title?: string
  meta_description?: string
  article_content?: string
  seo_score?: number
  primary_keywords?: string[]
  secondary_keywords?: string[]
  keyword_usage_summary?: string
  heading_structure?: string[]
  word_count?: number
  readability_score?: number
  improvement_notes?: string[]
  optimization_summary?: string
  competitor_insights?: string
}

interface GraphicsResult {
  description?: string
  style?: string
  prompt_used?: string
  suggestions?: string[]
  imageUrl?: string
}

// ----- Sample Data -----

const SAMPLE_CONTENT_RESULT: ContentResult = {
  title: 'The Ultimate Guide to Content Marketing in 2025',
  meta_description: 'Discover the latest content marketing strategies, tools, and best practices to drive organic growth and engagement in 2025.',
  article_content: '# The Ultimate Guide to Content Marketing in 2025\n\n## Introduction\n\nContent marketing continues to evolve rapidly. In 2025, brands that embrace **AI-assisted workflows**, **data-driven strategy**, and **multi-channel distribution** will dominate organic search.\n\n## Key Strategies\n\n### 1. AI-Powered Content Creation\n\nLeverage AI tools to research topics, generate outlines, and produce first drafts faster than ever before.\n\n### 2. SEO-First Approach\n\nEvery piece of content should be optimized for search engines from the start:\n\n- Target long-tail keywords with clear search intent\n- Structure content with proper heading hierarchy\n- Include internal and external links\n- Optimize meta descriptions and title tags\n\n### 3. Visual Content Integration\n\nArticles with custom graphics receive **94% more views** than text-only content.\n\n## Measuring Success\n\nTrack these key metrics:\n\n1. Organic traffic growth\n2. Keyword ranking improvements\n3. Engagement rate (time on page, scroll depth)\n4. Conversion rate from content\n5. Backlink acquisition\n\n## Conclusion\n\nContent marketing in 2025 is about working smarter, not harder. Combine AI efficiency with human creativity for maximum impact.',
  seo_score: 87,
  primary_keywords: ['content marketing', 'SEO optimization', 'content strategy 2025'],
  secondary_keywords: ['organic growth', 'AI content creation', 'keyword research', 'digital marketing'],
  keyword_usage_summary: 'Primary keywords used 8 times across headings and body. Secondary keywords distributed naturally throughout sections.',
  heading_structure: ['H1: The Ultimate Guide to Content Marketing in 2025', 'H2: Introduction', 'H2: Key Strategies', 'H3: AI-Powered Content Creation', 'H3: SEO-First Approach', 'H3: Visual Content Integration', 'H2: Measuring Success', 'H2: Conclusion'],
  word_count: 1847,
  readability_score: 72,
  improvement_notes: ['Consider adding more internal links to related articles', 'Include a FAQ section targeting featured snippets', 'Add schema markup recommendations for the how-to sections', 'Consider splitting into a multi-part series for deeper coverage'],
  optimization_summary: 'This article scores well for on-page SEO with proper heading hierarchy, keyword distribution, and readability. The meta description is within optimal length. Primary improvements are adding FAQ schema and internal link structure.',
  competitor_insights: 'Top 3 competing articles average 2,200 words and include video embeds. Consider expanding the measuring success section and adding case studies to differentiate.',
}

const SAMPLE_GRAPHICS_RESULT: GraphicsResult = {
  description: 'Modern marketing dashboard illustration with gradient elements',
  style: 'Modern',
  prompt_used: 'Create a modern marketing graphic with gradient backgrounds, clean typography, and data visualization elements representing growth metrics',
  suggestions: ['Try adding brand-specific color schemes', 'Consider a dark mode variant', 'Add social media dimension variants'],
  imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
}

function buildSampleHistory(): HistoryItem[] {
  const now = Date.now()
  return [
    {
      id: 'sample-1',
      type: 'article',
      title: 'The Ultimate Guide to Content Marketing in 2025',
      content: SAMPLE_CONTENT_RESULT.article_content,
      seoScore: 87,
      metaDescription: SAMPLE_CONTENT_RESULT.meta_description,
      keywords: SAMPLE_CONTENT_RESULT.primary_keywords,
      timestamp: new Date(now - 3600000).toISOString(),
    },
    {
      id: 'sample-2',
      type: 'graphic',
      title: 'Modern Marketing Dashboard Graphic',
      imageUrl: SAMPLE_GRAPHICS_RESULT.imageUrl,
      timestamp: new Date(now - 7200000).toISOString(),
    },
    {
      id: 'sample-3',
      type: 'optimization',
      title: 'SEO Optimization Report - Homepage',
      content: 'Optimization analysis complete. Score improved from 62 to 84.',
      seoScore: 84,
      keywords: ['homepage optimization', 'conversion rate'],
      timestamp: new Date(now - 86400000).toISOString(),
    },
  ]
}

// ----- Helpers -----

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function getSeoColor(score: number): string {
  if (score > 70) return 'bg-green-500'
  if (score > 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getSeoTextColor(score: number): string {
  if (score > 70) return 'text-green-600'
  if (score > 40) return 'text-yellow-600'
  return 'text-red-600'
}

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ----- Nav -----

type PageType = 'dashboard' | 'content' | 'graphics' | 'history'

const NAV_ITEMS: { key: PageType; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <HiOutlineHome className="w-5 h-5" /> },
  { key: 'content', label: 'Content Studio', icon: <HiOutlineDocumentText className="w-5 h-5" /> },
  { key: 'graphics', label: 'Graphics Studio', icon: <HiOutlinePhotograph className="w-5 h-5" /> },
  { key: 'history', label: 'History', icon: <HiOutlineClock className="w-5 h-5" /> },
]

// ===== Screen: Dashboard =====

function DashboardScreen({
  onNavigate,
  history,
  sampleMode,
}: {
  onNavigate: (page: PageType) => void
  history: HistoryItem[]
  sampleMode: boolean
}) {
  const [sampleHistory, setSampleHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (sampleMode && history.length === 0) {
      setSampleHistory(buildSampleHistory())
    }
  }, [sampleMode, history.length])

  const displayHistory = sampleMode && history.length === 0 ? sampleHistory : history
  const recentItems = displayHistory.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.01em' }}>Welcome to Marketing Command Center</h1>
        <p className="text-muted-foreground mt-1" style={{ lineHeight: '1.55' }}>Create SEO-optimized content and stunning graphics from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group" onClick={() => onNavigate('content')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <HiOutlineDocumentText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Content Studio</CardTitle>
                <CardDescription>Create and optimize SEO-driven articles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4" style={{ lineHeight: '1.55' }}>Generate full articles with keyword research, competitor analysis, and SEO scoring -- powered by a manager agent coordinating specialized sub-agents.</p>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); onNavigate('content') }}>
              Open Studio <HiOutlineChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group" onClick={() => onNavigate('graphics')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <HiOutlinePhotograph className="w-7 h-7 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl">Graphics Studio</CardTitle>
                <CardDescription>Generate marketing visuals and illustrations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4" style={{ lineHeight: '1.55' }}>Describe the visual you need and get AI-generated graphics in multiple styles -- modern, minimalist, bold, illustrated, or photorealistic.</p>
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); onNavigate('graphics') }}>
              Open Studio <HiOutlineChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {recentItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
              View All <HiOutlineChevronRight className="ml-1 w-4 h-4" />
            </Button>
          )}
        </div>
        {recentItems.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-sm border border-white/15">
            <CardContent className="py-12 text-center">
              <HiOutlineClock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activity yet. Start by creating content or generating graphics.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/40 backdrop-blur-sm border border-white/15">
            <CardContent className="p-0">
              {recentItems.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-4 px-5 py-3 ${idx < recentItems.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <Badge variant={item.type === 'article' ? 'default' : item.type === 'graphic' ? 'secondary' : 'outline'} className="capitalize min-w-[100px] justify-center text-xs">
                    {item.type}
                  </Badge>
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.timestamp)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ===== Screen: Content Studio =====

function ContentStudioScreen({
  onHistoryAdd,
  sampleMode,
  onAgentActive,
}: {
  onHistoryAdd: (item: HistoryItem) => void
  sampleMode: boolean
  onAgentActive: (id: string | null) => void
}) {
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Create form
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('General')
  const [tone, setTone] = useState('Professional')
  const [keywordsInput, setKeywordsInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

  // Optimize form
  const [optimizeUrl, setOptimizeUrl] = useState('')
  const [optimizeContent, setOptimizeContent] = useState('')

  // Result
  const [contentResult, setContentResult] = useState<ContentResult | null>(null)

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const agentActivity = useLyzrAgentEvents(sessionId)

  // Sample data effect
  useEffect(() => {
    if (sampleMode && !contentResult) {
      setTopic('Content marketing strategies for SaaS companies in 2025')
      setAudience('Marketers')
      setTone('Authoritative')
      setKeywords(['content marketing', 'SaaS', 'B2B marketing'])
      setKeywordsInput('')
      setContentResult(SAMPLE_CONTENT_RESULT)
    }
    if (!sampleMode && contentResult === SAMPLE_CONTENT_RESULT) {
      setTopic('')
      setAudience('General')
      setTone('Professional')
      setKeywords([])
      setKeywordsInput('')
      setContentResult(null)
    }
  }, [sampleMode])

  const startLoadingMessages = useCallback((messages: string[]) => {
    let idx = 0
    setLoadingMsg(messages[0] ?? 'Processing...')
    loadingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % messages.length
      setLoadingMsg(messages[idx] ?? 'Processing...')
    }, 3000)
  }, [])

  const stopLoadingMessages = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
    setLoadingMsg('')
  }, [])

  const handleAddKeyword = useCallback(() => {
    if (!keywordsInput.trim()) return
    const newKws = keywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0)
    setKeywords(prev => [...prev, ...newKws.filter(k => !prev.includes(k))])
    setKeywordsInput('')
  }, [keywordsInput])

  const handleRemoveKeyword = useCallback((kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setContentResult(null)
    onAgentActive(CONTENT_AGENT_ID)
    startLoadingMessages(LOADING_MESSAGES_CONTENT)

    const kwString = keywords.length > 0 ? ` Keywords to include: ${keywords.join(', ')}.` : ''
    const message = `Write an SEO-optimized article about: ${topic.trim()}. Target audience: ${audience}. Tone: ${tone}.${kwString}`

    try {
      const result = await callAIAgent(message, CONTENT_AGENT_ID)
      if (result?.session_id) setSessionId(result.session_id)

      if (result?.success) {
        const data = result?.response?.result as ContentResult | undefined
        if (data) {
          setContentResult(data)
          onHistoryAdd({
            id: generateId(),
            type: 'article',
            title: data?.title ?? topic.trim(),
            content: data?.article_content ?? '',
            seoScore: data?.seo_score,
            metaDescription: data?.meta_description,
            keywords: Array.isArray(data?.primary_keywords) ? data.primary_keywords : [],
            timestamp: new Date().toISOString(),
          })
        } else {
          setError('Received empty response from agent.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate content. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      onAgentActive(null)
      stopLoadingMessages()
    }
  }, [topic, audience, tone, keywords, startLoadingMessages, stopLoadingMessages, onHistoryAdd, onAgentActive])

  const handleOptimize = useCallback(async () => {
    const input = optimizeUrl.trim() || optimizeContent.trim()
    if (!input) return
    setLoading(true)
    setError(null)
    setContentResult(null)
    onAgentActive(CONTENT_AGENT_ID)
    startLoadingMessages(LOADING_MESSAGES_CONTENT)

    const message = optimizeUrl.trim()
      ? `Analyze and optimize this content for SEO. URL: ${optimizeUrl.trim()}`
      : `Analyze and optimize this content for SEO:\n\n${optimizeContent.trim()}`

    try {
      const result = await callAIAgent(message, CONTENT_AGENT_ID)
      if (result?.session_id) setSessionId(result.session_id)

      if (result?.success) {
        const data = result?.response?.result as ContentResult | undefined
        if (data) {
          setContentResult(data)
          onHistoryAdd({
            id: generateId(),
            type: 'optimization',
            title: data?.title ?? 'SEO Optimization Report',
            content: data?.optimization_summary ?? data?.article_content ?? '',
            seoScore: data?.seo_score,
            metaDescription: data?.meta_description,
            keywords: Array.isArray(data?.primary_keywords) ? data.primary_keywords : [],
            timestamp: new Date().toISOString(),
          })
        } else {
          setError('Received empty response from agent.')
        }
      } else {
        setError(result?.error ?? 'Failed to optimize. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      onAgentActive(null)
      stopLoadingMessages()
    }
  }, [optimizeUrl, optimizeContent, startLoadingMessages, stopLoadingMessages, onHistoryAdd, onAgentActive])

  const handleCopy = useCallback(async () => {
    if (!contentResult?.article_content) return
    const md = `# ${contentResult?.title ?? ''}\n\n${contentResult.article_content}`
    await copyToClipboard(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [contentResult])

  const handleDownload = useCallback(() => {
    if (!contentResult?.article_content) return
    const md = `# ${contentResult?.title ?? ''}\n\nMeta Description: ${contentResult?.meta_description ?? ''}\n\n${contentResult.article_content}`
    const safeName = (contentResult?.title ?? 'article').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    downloadMarkdown(md, `${safeName}.md`)
  }, [contentResult])

  const handleRegenerate = useCallback(() => {
    if (activeTab === 'create') {
      handleGenerate()
    } else {
      handleOptimize()
    }
  }, [activeTab, handleGenerate, handleOptimize])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.01em' }}>Content Studio</h1>
        <p className="text-muted-foreground mt-1">Create SEO-optimized articles or analyze existing content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-2">
                <TabsList className="w-full">
                  <TabsTrigger value="create" className="flex-1 text-xs">Create New Article</TabsTrigger>
                  <TabsTrigger value="optimize" className="flex-1 text-xs">Optimize Existing</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <TabsContent value="create" className="mt-0 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Topic</Label>
                    <Textarea
                      placeholder="Describe the article topic in detail..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Target Audience</Label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Marketers">Marketers</SelectItem>
                          <SelectItem value="Developers">Developers</SelectItem>
                          <SelectItem value="Executives">Executives</SelectItem>
                          <SelectItem value="Small Business">Small Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Authoritative">Authoritative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Keywords (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter keywords, comma-separated"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword() } }}
                      />
                      <Button variant="outline" size="sm" onClick={handleAddKeyword} className="shrink-0 px-2.5">
                        <HiOutlinePlus className="w-4 h-4" />
                      </Button>
                    </div>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {keywords.map((kw) => (
                          <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                            {kw}
                            <button onClick={() => handleRemoveKeyword(kw)} className="ml-1 hover:text-destructive transition-colors">
                              <HiOutlineX className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleGenerate} disabled={loading || !topic.trim()}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <HiOutlinePencil className="w-4 h-4" />
                        Generate Article
                      </span>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="optimize" className="mt-0 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">URL (optional)</Label>
                    <Input
                      placeholder="https://example.com/article"
                      value={optimizeUrl}
                      onChange={(e) => setOptimizeUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Paste Content</Label>
                    <Textarea
                      placeholder="Paste your article content here for SEO analysis..."
                      value={optimizeContent}
                      onChange={(e) => setOptimizeContent(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                  <Button className="w-full" onClick={handleOptimize} disabled={loading || (!optimizeUrl.trim() && !optimizeContent.trim())}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <HiOutlineTrendingUp className="w-4 h-4" />
                        Analyze and Optimize
                      </span>
                    )}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {sessionId && (
            <AgentActivityPanel {...agentActivity} />
          )}
        </div>

        {/* Right: Output Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
              <CardContent className="py-16 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">{loadingMsg}</p>
                <div className="space-y-3 px-8">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-24 w-full mt-4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-white/60 backdrop-blur-md border border-red-200/50 shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-destructive font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={handleRegenerate}>
                  <HiOutlineRefresh className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </CardContent>
            </Card>
          ) : contentResult ? (
            <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl leading-tight">{contentResult?.title ?? 'Generated Content'}</CardTitle>
                    {contentResult?.meta_description && (
                      <p className="text-sm text-muted-foreground mt-1.5 italic leading-relaxed">{contentResult.meta_description}</p>
                    )}
                  </div>
                  {typeof contentResult?.seo_score === 'number' && (
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${getSeoColor(contentResult.seo_score)}`}>
                        {contentResult.seo_score}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">SEO Score</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <HiOutlineClipboardCopy className="w-4 h-4 mr-1.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <HiOutlineDownload className="w-4 h-4 mr-1.5" /> Download MD
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRegenerate}>
                    <HiOutlineRefresh className="w-4 h-4 mr-1.5" /> Regenerate
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ScrollArea className="h-[420px] pr-3">
                  <div className="space-y-6">
                    {/* Article */}
                    {contentResult?.article_content && (
                      <div>
                        {renderMarkdown(contentResult.article_content)}
                      </div>
                    )}

                    <Separator />

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {typeof contentResult?.word_count === 'number' && (
                        <div className="text-center p-3 rounded-xl bg-secondary/50">
                          <p className="text-lg font-bold">{contentResult.word_count}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Words</p>
                        </div>
                      )}
                      {typeof contentResult?.readability_score === 'number' && (
                        <div className="text-center p-3 rounded-xl bg-secondary/50">
                          <p className={`text-lg font-bold ${getSeoTextColor(contentResult.readability_score)}`}>{contentResult.readability_score}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Readability</p>
                        </div>
                      )}
                      {typeof contentResult?.seo_score === 'number' && (
                        <div className="text-center p-3 rounded-xl bg-secondary/50">
                          <p className={`text-lg font-bold ${getSeoTextColor(contentResult.seo_score)}`}>{contentResult.seo_score}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">SEO</p>
                        </div>
                      )}
                      {Array.isArray(contentResult?.heading_structure) && (
                        <div className="text-center p-3 rounded-xl bg-secondary/50">
                          <p className="text-lg font-bold">{contentResult.heading_structure.length}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Headings</p>
                        </div>
                      )}
                    </div>

                    {/* Primary Keywords */}
                    {Array.isArray(contentResult?.primary_keywords) && contentResult.primary_keywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <HiOutlineTag className="w-4 h-4 text-primary" /> Primary Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {contentResult.primary_keywords.map((kw, i) => (
                            <Badge key={i} className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Secondary Keywords */}
                    {Array.isArray(contentResult?.secondary_keywords) && contentResult.secondary_keywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <HiOutlineTag className="w-4 h-4" /> Secondary Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {contentResult.secondary_keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword Usage Summary */}
                    {contentResult?.keyword_usage_summary && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Keyword Usage Summary</h4>
                        <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-xl">{contentResult.keyword_usage_summary}</p>
                      </div>
                    )}

                    {/* Heading Structure */}
                    {Array.isArray(contentResult?.heading_structure) && contentResult.heading_structure.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Heading Structure</h4>
                        <ul className="space-y-1">
                          {contentResult.heading_structure.map((h, i) => {
                            const isH1 = h.startsWith('H1')
                            const isH2 = h.startsWith('H2')
                            return (
                              <li key={i} className={`text-xs text-muted-foreground flex items-start gap-1.5 ${isH2 ? 'ml-3' : ''} ${!isH1 && !isH2 ? 'ml-6' : ''}`}>
                                <span className="text-primary mt-0.5 shrink-0">--</span> {h}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Optimization Summary */}
                    {contentResult?.optimization_summary && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Optimization Summary</h4>
                        <div className="bg-secondary/30 p-3 rounded-xl">
                          {renderMarkdown(contentResult.optimization_summary)}
                        </div>
                      </div>
                    )}

                    {/* Competitor Insights */}
                    {contentResult?.competitor_insights && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Competitor Insights</h4>
                        <div className="bg-secondary/30 p-3 rounded-xl">
                          {renderMarkdown(contentResult.competitor_insights)}
                        </div>
                      </div>
                    )}

                    {/* Improvement Notes */}
                    {Array.isArray(contentResult?.improvement_notes) && contentResult.improvement_notes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Improvement Notes</h4>
                        <ul className="space-y-2">
                          {contentResult.improvement_notes.map((note, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground bg-secondary/20 p-2.5 rounded-lg">
                              <span className="text-primary font-bold shrink-0 mt-0.5">{i + 1}.</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/40 backdrop-blur-sm border border-white/15 shadow-md">
              <CardContent className="py-24 text-center">
                <HiOutlineDocumentText className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Ready to Create</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto" style={{ lineHeight: '1.55' }}>
                  Fill in the form on the left to generate an SEO-optimized article or analyze existing content. The Content Orchestrator coordinates keyword research, writing, and optimization agents automatically.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Screen: Graphics Studio =====

function GraphicsStudioScreen({
  onHistoryAdd,
  sampleMode,
  onAgentActive,
}: {
  onHistoryAdd: (item: HistoryItem) => void
  sampleMode: boolean
  onAgentActive: (id: string | null) => void
}) {
  const [description, setDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('Modern')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [graphicsResult, setGraphicsResult] = useState<GraphicsResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const agentActivity = useLyzrAgentEvents(sessionId)

  const styles = ['Modern', 'Minimalist', 'Bold', 'Illustrated', 'Photorealistic']

  useEffect(() => {
    if (sampleMode && !graphicsResult) {
      setDescription('A modern dashboard with gradient colors showing marketing analytics')
      setSelectedStyle('Modern')
      setGraphicsResult(SAMPLE_GRAPHICS_RESULT)
    }
    if (!sampleMode && graphicsResult === SAMPLE_GRAPHICS_RESULT) {
      setDescription('')
      setSelectedStyle('Modern')
      setGraphicsResult(null)
    }
  }, [sampleMode])

  const startLoadingMessages = useCallback(() => {
    let idx = 0
    setLoadingMsg(LOADING_MESSAGES_GRAPHICS[0] ?? 'Processing...')
    loadingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES_GRAPHICS.length
      setLoadingMsg(LOADING_MESSAGES_GRAPHICS[idx] ?? 'Processing...')
    }, 3000)
  }, [])

  const stopLoadingMessages = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
    setLoadingMsg('')
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setGraphicsResult(null)
    onAgentActive(GRAPHICS_AGENT_ID)
    startLoadingMessages()

    const message = `Create a ${selectedStyle.toLowerCase()} marketing graphic: ${description.trim()}`

    try {
      const result = await callAIAgent(message, GRAPHICS_AGENT_ID)
      if (result?.session_id) setSessionId(result.session_id)

      if (result?.success) {
        const data = result?.response?.result as Record<string, unknown> | undefined
        const artifactFiles = result?.module_outputs?.artifact_files
        const imageUrl = Array.isArray(artifactFiles) ? (artifactFiles[0]?.file_url as string | undefined) : undefined

        const gr: GraphicsResult = {
          description: typeof data?.description === 'string' ? data.description : '',
          style: typeof data?.style === 'string' ? data.style : selectedStyle,
          prompt_used: typeof data?.prompt_used === 'string' ? data.prompt_used : '',
          suggestions: Array.isArray(data?.suggestions) ? (data.suggestions as string[]) : [],
          imageUrl: imageUrl ?? '',
        }
        setGraphicsResult(gr)
        onHistoryAdd({
          id: generateId(),
          type: 'graphic',
          title: gr.description || description.trim(),
          imageUrl: gr.imageUrl,
          timestamp: new Date().toISOString(),
        })
      } else {
        setError(result?.error ?? 'Failed to generate graphic. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      onAgentActive(null)
      stopLoadingMessages()
    }
  }, [description, selectedStyle, startLoadingMessages, stopLoadingMessages, onHistoryAdd, onAgentActive])

  const handleDownloadImage = useCallback(async () => {
    if (!graphicsResult?.imageUrl) return
    try {
      const resp = await fetch(graphicsResult.imageUrl)
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `graphic-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(graphicsResult.imageUrl, '_blank')
    }
  }, [graphicsResult])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.01em' }}>Graphics Studio</h1>
        <p className="text-muted-foreground mt-1">Generate marketing visuals and illustrations with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Describe Your Graphic</CardTitle>
              <CardDescription>Tell us what you need and pick a style.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the graphic you need... e.g., A hero image for a blog post about AI in marketing"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <div>
                <Label className="text-sm font-medium mb-2 block">Style</Label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStyle(s)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${selectedStyle === s ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' : 'bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary hover:border-primary/30'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={loading || !description.trim()}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiOutlineColorSwatch className="w-4 h-4" />
                    Generate Graphic
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {sessionId && (
            <AgentActivityPanel {...agentActivity} />
          )}
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
              <CardContent className="py-20 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">{loadingMsg}</p>
                <Skeleton className="h-64 w-full rounded-xl" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-white/60 backdrop-blur-md border border-red-200/50 shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-destructive font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={handleGenerate}>
                  <HiOutlineRefresh className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </CardContent>
            </Card>
          ) : graphicsResult ? (
            <Card className="bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
              <CardContent className="p-5 space-y-5">
                {graphicsResult.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/30">
                    <img
                      src={graphicsResult.imageUrl}
                      alt={graphicsResult.description ?? 'Generated graphic'}
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl bg-muted/50 border border-border/30 aspect-video">
                    <p className="text-muted-foreground text-sm">No image generated. The response may contain text only.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {graphicsResult.imageUrl && (
                    <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                      <HiOutlineDownload className="w-4 h-4 mr-1.5" /> Download
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <HiOutlineRefresh className="w-4 h-4 mr-1.5" /> Regenerate
                  </Button>
                </div>

                <Separator />

                {graphicsResult.description && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{graphicsResult.description}</p>
                  </div>
                )}

                {graphicsResult.style && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Style</h4>
                    <Badge variant="secondary">{graphicsResult.style}</Badge>
                  </div>
                )}

                {graphicsResult.prompt_used && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Prompt Used</h4>
                    <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-xl font-mono leading-relaxed">{graphicsResult.prompt_used}</p>
                  </div>
                )}

                {Array.isArray(graphicsResult.suggestions) && graphicsResult.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1.5">Suggestions</h4>
                    <ul className="space-y-1.5">
                      {graphicsResult.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary shrink-0 mt-0.5">-</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/40 backdrop-blur-sm border border-white/15 shadow-md">
              <CardContent className="py-24 text-center">
                <HiOutlinePhotograph className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Ready to Create</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto" style={{ lineHeight: '1.55' }}>
                  Describe the marketing graphic you need and select a style. The Graphics Generator will create a custom visual for you.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Screen: History =====

function HistoryScreen({
  history,
  onDelete,
  sampleMode,
}: {
  history: HistoryItem[]
  onDelete: (id: string) => void
  sampleMode: boolean
}) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewItem, setViewItem] = useState<HistoryItem | null>(null)
  const [sampleHistory, setSampleHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (sampleMode && history.length === 0) {
      setSampleHistory(buildSampleHistory())
    }
  }, [sampleMode, history.length])

  const displayHistory = sampleMode && history.length === 0 ? sampleHistory : history

  const filtered = useMemo(() => {
    return displayHistory.filter((item) => {
      if (filter !== 'all' && item.type !== filter) return false
      if (search.trim() && !item.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [displayHistory, filter, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.01em' }}>History</h1>
        <p className="text-muted-foreground mt-1">View and manage your generated content and graphics.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={filter} onValueChange={setFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="article" className="text-xs">Articles</TabsTrigger>
            <TabsTrigger value="optimization" className="text-xs">Optimizations</TabsTrigger>
            <TabsTrigger value="graphic" className="text-xs">Graphics</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-white/40 backdrop-blur-sm border border-white/15">
          <CardContent className="py-16 text-center">
            <HiOutlineClock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search.trim() ? 'No items match your search.' : 'No history items yet. Start creating content or graphics.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-white/60 backdrop-blur-md border border-white/20 shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={item.type === 'article' ? 'default' : item.type === 'graphic' ? 'secondary' : 'outline'} className="capitalize text-xs shrink-0">
                        {item.type}
                      </Badge>
                      {typeof item.seoScore === 'number' && (
                        <span className={`text-xs font-semibold ${getSeoTextColor(item.seoScore)}`}>
                          SEO: {item.seoScore}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.timestamp)}</p>
                  </div>
                  {item.type === 'graphic' && item.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => setViewItem(item)}>
                    <HiOutlineEye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
                    <HiOutlineTrash className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => { if (!open) setViewItem(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.title ?? 'Item Detail'}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{viewItem?.type ?? ''}</Badge>
                <span className="text-xs">{viewItem?.timestamp ? formatDate(viewItem.timestamp) : ''}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            {viewItem?.type === 'graphic' && viewItem?.imageUrl && (
              <div className="rounded-xl overflow-hidden bg-muted border border-border/30">
                <img src={viewItem.imageUrl} alt={viewItem.title} className="w-full object-contain max-h-96" />
              </div>
            )}
            {viewItem?.content && (
              <div>
                {renderMarkdown(viewItem.content)}
              </div>
            )}
            {viewItem?.metaDescription && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Meta Description</h4>
                <p className="text-sm text-muted-foreground italic">{viewItem.metaDescription}</p>
              </div>
            )}
            {typeof viewItem?.seoScore === 'number' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">SEO Score:</span>
                <span className={`font-bold ${getSeoTextColor(viewItem.seoScore)}`}>{viewItem.seoScore}/100</span>
              </div>
            )}
            {Array.isArray(viewItem?.keywords) && viewItem.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1.5">Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewItem.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Agent Info Panel =====

function AgentInfoPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="mt-auto pt-4 border-t border-border/50">
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1 font-medium">Agents</h4>
      <div className="space-y-1.5">
        {AGENTS.map((agent) => (
          <div key={agent.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${activeAgentId === agent.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${activeAgentId === agent.id ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
            <div className="min-w-0">
              <p className="font-medium truncate">{agent.name}</p>
              <p className="text-[10px] opacity-70 truncate">{agent.purpose}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Main Page =====

export default function Page() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load history from localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('mcc_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem('mcc_history', JSON.stringify(history))
    } catch {
      // Ignore
    }
  }, [history, mounted])

  const handleHistoryAdd = useCallback((item: HistoryItem) => {
    setHistory((prev) => [item, ...prev])
  }, [])

  const handleHistoryDelete = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  if (!mounted) {
    return (
      <div style={THEME_VARS} className="min-h-screen flex items-center justify-center" >
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={THEME_VARS} className="min-h-screen font-sans" >
      <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(30, 50%, 97%) 0%, hsl(20, 45%, 95%) 35%, hsl(40, 40%, 96%) 70%, hsl(15, 35%, 97%) 100%)' }}>
        {/* Sidebar */}
        <aside className="w-[250px] shrink-0 border-r border-border/50 bg-white/50 backdrop-blur-md flex flex-col p-4 fixed top-0 left-0 h-screen z-20">
          {/* Logo */}
          <div className="mb-8 px-2 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(24, 95%, 53%), hsl(12, 80%, 50%))' }}>
                <HiOutlineTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-tight">Marketing</h1>
                <h1 className="text-sm font-bold tracking-tight leading-tight text-primary">Command Center</h1>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${currentPage === item.key ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sample Data Toggle */}
          <div className="px-2 py-3 border-t border-border/50 mb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sample-toggle" className="text-xs font-medium text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
            </div>
          </div>

          {/* Agent Info */}
          <AgentInfoPanel activeAgentId={activeAgentId} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-[250px] p-6 lg:p-8">
          {currentPage === 'dashboard' && (
            <DashboardScreen
              onNavigate={setCurrentPage}
              history={history}
              sampleMode={sampleMode}
            />
          )}
          {currentPage === 'content' && (
            <ContentStudioScreen
              onHistoryAdd={handleHistoryAdd}
              sampleMode={sampleMode}
              onAgentActive={setActiveAgentId}
            />
          )}
          {currentPage === 'graphics' && (
            <GraphicsStudioScreen
              onHistoryAdd={handleHistoryAdd}
              sampleMode={sampleMode}
              onAgentActive={setActiveAgentId}
            />
          )}
          {currentPage === 'history' && (
            <HistoryScreen
              history={history}
              onDelete={handleHistoryDelete}
              sampleMode={sampleMode}
            />
          )}
        </main>
      </div>
    </div>
  )
}
