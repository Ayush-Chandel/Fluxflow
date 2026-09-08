import { Link } from "react-router-dom";
import logo from "@/assets/finallogo.svg";
import { useAuthStore } from "@/store/authStore";

const navigationItems = ["Product", "Resources", "Customers", "Pricing", "Now", 'Contact'];

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#010213]">
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
          {user ? (
            <>
              <span className="mx-3 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
              <button
                type="button"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Docs
              </button>
              <Link
                to="/app/issues"
                className="ml-1 rounded-full bg-[#eeeef5] px-3.5 py-2 font-medium text-[#1b1b2d] transition-colors hover:bg-white"
              >
                Open app
              </Link>
            </>
          ) : (
            <>
              <span className="mx-3 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
              <Link
                to="/login"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-[#eeeef5] px-3.5 py-1.5 font-medium text-[#1b1b2d] transition-colors hover:bg-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
