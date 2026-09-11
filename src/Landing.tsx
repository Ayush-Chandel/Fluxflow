import Header from "./components/common/Header";
import Capability from "./components/landing/Capability/Capability";
import Hero from "./components/landing/Hero";
import HighlightTimeline from "./components/landing/HighlightTimeline";
import HorizontalFlow from "./components/landing/HorizontalFlow";
import { UnlikeAnyTool } from "./components/landing/UnlikeAnyTool";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#010213] text-foreground">
      <Header />
      <Hero />
      <HorizontalFlow />
      <UnlikeAnyTool />
      <HighlightTimeline />
      <Capability/>
      <div className="h-[1200px]">
        here
      </div>
    </div>
  );
}