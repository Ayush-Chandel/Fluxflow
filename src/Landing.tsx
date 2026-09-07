
import Header from "./components/common/Header";
import Hero from "./components/landing/Hero";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#010213] text-foreground">
      <Header />
      <Hero/>
    </div>
  );
}