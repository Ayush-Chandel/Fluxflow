import logo from "@/assets/finallogo.svg";

const navigationItems = ["Product", "Resources", "Customers", "Pricing", "Now", 'Contact'];

export default function Header() {
  return (
    <header className="border-b border-white/[0.08]">
      <nav
        className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-6 lg:px-0"
        aria-label="Primary navigation"
      >
        <button
          type="button"
          className="flex items-center gap-2 text-[20px] font-medium tracking-[-0.04em] text-white transition-opacity hover:opacity-80"
          aria-label="Fluxflow home"
        >
          <img src={logo} alt="" className="h-7 w-7 object-contain" />
          <span>Fluxflow</span>
        </button>

        <div className="hidden items-center gap-1 text-[14px] text-[#777789] md:flex">
          {navigationItems.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {item}
            </button>
          ))}
          <span className="mx-3 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
          <button
            type="button"
            className="rounded-full px-3 py-2 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Docs
          </button>
        </div>
      </nav>
    </header>
  );
}
