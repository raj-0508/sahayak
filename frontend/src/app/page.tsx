import { Icons } from "@/components/icons";
import Link from "next/link";
import {
  GraduationCap, BookOpen, ClipboardList,
  BarChart, Brain, Bot, Network, Sparkles
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen" style={{ fontFamily: 'Quantico, monospace' }}>

      {/* ── HERO ── */}
      <section className="hero-gradient min-h-[92vh] flex items-center justify-center px-6 md:px-16 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Label */}
          <p className="text-sm font-medium mb-5 tracking-widest uppercase"
            style={{ color: 'hsl(var(--primary))' }}>
            AI-Powered Teaching Assistant
          </p>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight text-white"
            style={{ lineHeight: 1.1 }}>
            Welcome to{' '}
            <span className="text-gradient-sahayak notranslate">Sahayak</span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed text-white/80">
            Your AI-powered teaching assistant designed for multi-grade classrooms in India.{' '}
            <span className="font-semibold text-white">Create dynamic, culturally relevant educational content</span>{' '}
            and transform learning experiences.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="teal-btn px-8 py-3 text-base font-semibold">
              Get Started Free →
            </Link>
            <Link href="/login" className="teal-ghost-link px-4 py-3 text-base font-medium text-white/70 hover:text-white">
              Already have an account? 💬
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">

          {/* Section label */}
          <div className="text-center mb-14">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-widest uppercase mb-4 rounded"
              style={{
                border: '1px solid hsl(var(--primary) / 0.35)',
                color: 'hsl(var(--primary))',
                background: 'hsl(var(--primary) / 0.06)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Powerful Features
            </span>
            <h2 className="text-4xl font-bold mb-3 text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
              Whether you&#39;re a teacher creating content or a student learning, <span className="notranslate">Sahayak</span> has tools designed for you.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Brain, label: 'AI Content Generation', desc: "Generate culturally relevant content, worksheets, and visual aids using Google's Gemini AI" },
              { icon: ClipboardList, label: 'Smart Assessments', desc: 'Create AI-powered tests with automatic grading and detailed performance analytics' },
              { icon: BarChart, label: 'Progress Tracking', desc: 'Track student performance and get detailed analytics on learning outcomes' },
              { icon: BookOpen, label: 'Multi-Language Support', desc: 'Content in Hindi, Tamil, Telugu, and English with text-to-speech functionality' },
              { icon: Bot, label: 'Ask Ganesha AI', desc: 'Get instant AI-powered explanations and answers to any educational question' },
              { icon: Network, label: 'Concept Visualizer', desc: 'Visualize complex topics with interactive mind maps and concept diagrams' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="feature-card p-6">
                <div className="icon-box h-11 w-11 mb-4">
                  <Icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{label}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS SAHAYAK FOR ── */}
      <section className="section-alt py-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-3 text-foreground">
            Who is{' '}
            <span className="gradient-text notranslate">Sahayak</span>{' '}
            for?
          </h2>
          <p className="text-center text-muted-foreground mb-14 text-base">
            Designed for every member of the educational ecosystem
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

            {/* Student card */}
            <div className="user-card relative overflow-hidden p-8">
              {/* Decorative corner glow */}
              <div className="absolute top-0 right-0 w-36 h-36 rounded-bl-full opacity-40"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }} />

              <div className="flex items-center gap-3 mb-6">
                <div className="icon-box h-11 w-11">
                  <GraduationCap className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h3 className="text-xl font-bold text-foreground">For Students</h3>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Join classes and access shared learning materials',
                  'Take AI-powered tests and track your progress',
                  'Get instant help from Ask Ganesha AI assistant',
                  'Visualize complex concepts with interactive maps',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: 'hsl(var(--primary))' }} />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup?type=student" className="teal-btn block w-full py-3 text-sm font-semibold">
                Sign up as Student
              </Link>
            </div>

            {/* Teacher card */}
            <div className="user-card relative overflow-hidden p-8">
              <div className="absolute top-0 right-0 w-36 h-36 rounded-bl-full opacity-40"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }} />

              <div className="flex items-center gap-3 mb-6">
                <div className="icon-box h-11 w-11">
                  <BookOpen className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h3 className="text-xl font-bold text-foreground">For Teachers</h3>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Create and manage multiple classes effortlessly',
                  'Generate AI-powered tests and worksheets',
                  'Analyze content with smart RAG-powered tools',
                  'Monitor student progress with detailed analytics',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: 'hsl(var(--primary))' }} />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup?type=teacher" className="teal-btn block w-full py-3 text-sm font-semibold">
                Sign up as Teacher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="sahayak-footer py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Icons.logo className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-xl gradient-text notranslate" style={{ letterSpacing: '0.04em' }}>
              &lt;Sahayak/&gt;
            </span>
          </div>
          <p className="text-sm mb-1 text-muted-foreground">
            Developed for educational purposes by Raj Singhaniya
          </p>
          <p className="text-xs text-muted-foreground/60">
            Empowering Teachers, Transforming Education 🚀
          </p>
          <div className="mt-8 mx-auto h-px w-24"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }} />
        </div>
      </footer>
    </main>
  );
}
