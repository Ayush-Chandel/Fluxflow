import StyleReveal from "./components/landing/StyleReveal";
import Header from "./components/common/Header";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#010213] text-foreground">
      <Header />
      <StyleReveal/>
    </div>
  );
}