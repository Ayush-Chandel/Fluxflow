
import Header from "./components/common/Header";
import Hero from "./components/landing/Hero";
import HorizontalFlow from "./components/landing/HorizontalFlow";
import { UnlikeAnyTool } from "./components/landing/UnlikeAnyTool";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#010213] text-foreground">
      <Header />
      <Hero />
      <HorizontalFlow />
      <UnlikeAnyTool/>
    </div>
  );
}