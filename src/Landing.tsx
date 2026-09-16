import GlobalCursor from "./components/common/GlobalCursor";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Capability from "./components/landing/Capability/Capability";
import Hero from "./components/landing/Hero";
import HighlightTimeline from "./components/landing/HighlightTimeline";
import HorizontalFlow from "./components/landing/HorizontalFlow";
import TestimonialsPile from "./components/landing/TestimonialsPile";
import { UnlikeAnyTool } from "./components/landing/UnlikeAnyTool";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#010213] text-foreground">
      <GlobalCursor />
      <Header />
      <Hero />
      <HorizontalFlow />
      <UnlikeAnyTool />
      <HighlightTimeline />
      <Capability />
      <TestimonialsPile />
      <Footer />
    </div>
  );
}