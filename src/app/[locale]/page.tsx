import {
  AnimatedBackground,
  CursorGlow,
  DataStreams,
} from '@/components/effects/AnimatedBackground';
import { ActiveTasks } from '@/components/home/ActiveTasks';
import { Features } from '@/components/home/Features';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Stats } from '@/components/home/Stats';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen relative">
        {/* Animated background effects */}
        <AnimatedBackground />
        <DataStreams />
        <CursorGlow />

        <Header />
        <main className="relative z-10">
          <Hero />
          <Stats />
          <Features />
          <HowItWorks />
          <ActiveTasks />
        </main>
        <Footer />
      </div>
    </div>
  );
}
