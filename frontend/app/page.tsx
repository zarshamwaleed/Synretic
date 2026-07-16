'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  Zap, 
  ShoppingBag, 
  Package, 
  CreditCard, 
  Headset,
  ArrowRight,
  Star,
  Users,
  Clock,
  ChevronRight,
  Bot,
  MessageSquare,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// Simple Social Icons
const TwitterIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" />
  </svg>
)

const FacebookIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.462h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.91h-2.33V22c4.78-.756 8.438-4.92 8.438-9.94z" />
  </svg>
)

const InstagramIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
  </svg>
)

const LinkedinIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z" />
  </svg>
)

const YoutubeIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
  </svg>
)

export default function HomePage() {
  const router = useRouter()
  
  // Animation Orchestration States
  const [isIntroActive, setIsIntroActive] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [logoCharged, setLogoCharged] = useState(false)

  useEffect(() => {
    // Check if user has already seen intro this session
    const hasSeenIntro = sessionStorage.getItem('synretic_intro_seen')
    
    if (!hasSeenIntro) {
      setIsIntroActive(true)
      
      // Step 1: Trigger the "energy charge up" 400ms after load
      const chargeTimer = setTimeout(() => {
        setLogoCharged(true)
      }, 400)

      // Step 2: Begin fade out after 2.4 seconds
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true)
      }, 2400)

      // Step 3: Fully remove preloader after 3.2 seconds
      const finishTimer = setTimeout(() => {
        setIsIntroActive(false)
        sessionStorage.setItem('synretic_intro_seen', 'true')
      }, 3200)

      return () => {
        clearTimeout(chargeTimer)
        clearTimeout(fadeTimer)
        clearTimeout(finishTimer)
      }
    }
  }, [])

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Shopping',
      description: 'Get personalized product recommendations powered by advanced AI agents.',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Core Agent'
    },
    {
      icon: Zap,
      title: 'Smart Inventory',
      description: 'Real-time stock updates and intelligent inventory management.',
      color: 'from-purple-500 to-indigo-500',
      badge: 'Automated'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Fast, secure payment processing with intelligent retry logic.',
      color: 'from-pink-500 to-rose-500',
      badge: 'Encrypted'
    },
    {
      icon: Headset,
      title: '24/7 AI Support',
      description: 'Instant customer support with our intelligent AI assistants.',
      color: 'from-orange-500 to-amber-500',
      badge: 'Always On'
    }
  ]

  const stats = [
    { value: '98%', label: 'Satisfaction', icon: Star },
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '4.9', label: 'Average Rating', icon: Award },
    { value: '24/7', label: 'AI Support', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased overflow-x-hidden">
      
      {/* 🚀 Dynamic Full Screen Preloader */}
      {isIntroActive && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-all duration-1000 ease-out select-none
            ${isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}
          `}
        >
          {/* Cybernetic Grid/Background details inside Preloader */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-[80px] pointer-events-none transition-all duration-1000
            ${logoCharged ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}
          `} />

          <div className="relative flex flex-col items-center">
            {/* Concentric rotating system layers */}
            <div className={`relative flex items-center justify-center w-28 h-28 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl transition-all duration-1000 ease-out
              ${logoCharged ? 'scale-100 rotate-180 border-blue-500/30' : 'scale-75 rotate-0'}
            `}>
              {/* Spinning Accent Ring */}
              <div className={`absolute inset-0 rounded-3xl border-t-2 border-r-2 border-blue-500/40 animate-spin duration-1000`} />
              <div className={`absolute inset-2 rounded-2xl border-b-2 border-l-2 border-purple-500/30 animate-spin duration-700 [animation-direction:reverse]`} />
              
              {/* Inner Glowing Icon Core */}
              <div className={`relative z-10 p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 transition-all duration-700
                ${logoCharged ? 'shadow-[0_0_40px_rgba(59,130,246,0.5)] scale-110' : 'shadow-none scale-90'}
              `}>
                <Zap className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>

            {/* Glowing text block with expanding letter-spacing */}
            <div className="mt-8 text-center space-y-2">
              <h1 className={`text-3xl font-black uppercase tracking-widest text-white transition-all duration-1000 ease-out
                ${logoCharged ? 'letter-space-expanded opacity-100 scale-100' : 'opacity-0 scale-95'}
              `} style={{ letterSpacing: logoCharged ? '0.5em' : '0.1em' }}>
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Synretic
                </span>
              </h1>
              <p className={`text-xs text-slate-500 uppercase tracking-[0.25em] transition-all duration-1000 delay-300
                ${logoCharged ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}>
                Multi-Agent System Online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Background Glows for main page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-24 pb-20 md:pt-32 md:pb-28 border-b border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex">
                <Badge className="gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                  Next-Gen AI Multi-Agent System
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none">
                <span className="text-white">Intelligent Shopping</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  With Active AI Agents
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-xl font-light leading-relaxed">
                Experience the future of retail with Synretic. Our cooperative multi-agent system continuously orchestrates recommendations, updates inventory dynamically, and resolves support tickets instantly.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="group gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-950/40 rounded-xl transition-all"
                  onClick={() => router.push('/signup')}
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="group gap-2 border border-slate-800 hover:bg-slate-900 rounded-xl"
                  onClick={() => router.push('/products')}
                >
                  Browse Catalog
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Hero Visual Mockup: AI Agent Control Center */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-2xl -z-10 rounded-3xl" />
              <div className="border border-slate-800 bg-slate-950/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">synretic-agent-mesh.sh</span>
                </div>

                <div className="space-y-4">
                  {/* Agent Card 1 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200">Recommender Agent</p>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">ACTIVE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">Analyzing preferences... Recommended 4 items.</p>
                    </div>
                  </div>

                  {/* Agent Card 2 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200">Inventory Sync Agent</p>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">SYNCED</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">Database synchronized in real-time. No drift detected.</p>
                    </div>
                  </div>

                  {/* Agent Card 3 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-200">Support Agent</p>
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-mono">LISTENING</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">Ready to resolve queries instantly 24/7.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Floated Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-900 mt-16">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-2.5 border border-slate-800">
                  <stat.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section className="px-4 py-24 bg-slate-950 border-b border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Why Choose <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Synretic?</span>
            </h2>
            <p className="text-slate-400 font-light">
              We leverage an advanced multi-agent orchestrator designed to supercharge your standard retail journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-800/10 to-transparent pointer-events-none -z-10" />
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 shadow-md`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400 border-slate-800 px-2.5 py-1">
                      {feature.badge}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Clean Timeline Layout) */}
      <section className="px-4 py-24 bg-slate-950 border-b border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              How It <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-slate-400 font-light">Simple steps, orchestrated by heavy engineering behind the scenes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Ask AI Assistant',
                description: 'Tell our AI what you\'re looking for in natural language, directly within the interface.',
                icon: MessageSquare
              },
              {
                step: '02',
                title: 'Smart Recommendations',
                description: 'Get personalized, instant product suggestions verified by active agent checks.',
                icon: Sparkles
              },
              {
                step: '03',
                title: 'Purchase & Track',
                description: 'Complete payments smoothly and track automated order logistics in real-time.',
                icon: ShoppingBag
              }
            ].map((item, index) => (
              <div key={index} className="relative group p-6 rounded-2xl bg-slate-950 border border-slate-900 hover:border-slate-800 transition-all">
                <div className="absolute top-4 right-6 text-4xl font-black text-slate-900/60 group-hover:text-slate-800 transition-colors select-none">
                  {item.step}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                  <item.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-24 bg-slate-950 border-b border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              What Our <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Users Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Fashion Enthusiast',
                content: 'Synretic completely transformed my shopping experience. The AI recommendations are spot on!',
                avatar: 'SJ'
              },
              {
                name: 'Michael Chen',
                role: 'Tech Professional',
                content: 'The multi-agent system works flawlessly. Fast, intelligent, and incredibly helpful.',
                avatar: 'MC'
              },
              {
                name: 'Emily Davis',
                role: 'Business Owner',
                content: 'Managing inventory has never been easier. Synretic is a game-changer for retail.',
                avatar: 'ED'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all duration-300">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 italic mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{testimonial.name}</p>
                      <p className="text-[10px] text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 bg-slate-950">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-950 via-slate-950 to-purple-950 p-12 text-center border border-slate-800">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-3xl pointer-events-none -z-10" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Transform Your Shopping Experience?
              </h2>
              <p className="text-slate-300 font-light leading-relaxed text-sm sm:text-base">
                Join thousands of satisfied users who have already discovered the power of AI-driven, multi-agent shopping.
              </p>
              <div className="pt-2">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-950 hover:bg-slate-200 shadow-xl shadow-white/5 rounded-xl font-semibold px-8"
                  onClick={() => router.push('/signup')}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Synretic</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                AI-powered multi-agent retail orchestrator for the future of shopping.
              </p>
              <div className="flex gap-3.5 pt-1">
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><TwitterIcon className="h-4 w-4" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><FacebookIcon className="h-4 w-4" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><InstagramIcon className="h-4 w-4" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><LinkedinIcon className="h-4 w-4" /></a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors"><YoutubeIcon className="h-4 w-4" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400 font-light">
                <li><Link href="/products" className="hover:text-blue-400 transition-colors">Products</Link></li>
                <li><Link href="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-blue-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400 font-light">
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-blue-400 transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400 font-light">
                <li><Link href="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-900 text-center text-xs text-slate-500 font-light">
            <p>© 2026 Synretic. All rights reserved. Built with ❤️ and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}