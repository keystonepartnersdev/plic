import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { KeyMetrics } from './components/KeyMetrics';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { Security } from './components/Security';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <KeyMetrics />
      <HowItWorks />
      <Features />
      <Pricing />
      <Security />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
