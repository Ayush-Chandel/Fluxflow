import { Link } from "react-router-dom";
import logo from "@/assets/finallogo.svg";
import { useAuthStore } from "@/store/authStore";
import FlowingCTA from "./FlowingCTA";
import HoverTextLink from "./HoverTextLink";

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
            <HoverTextLink
              key={item}
              to={'#'}
              text={item}
              className="text-sm text-white/70 px-3.5 transition-colors duration-300"
              dataCursor={'link'}
            />
          ))}
          {user ? (
            <>
              <span className="mx-3 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
              <HoverTextLink
                to={'#'}
                text={'Docs'}
                className="text-sm text-white/70 transition-colors duration-300"
                dataCursor={'link'}
              />
              <FlowingCTA
                to="/app/issues"
                className="rounded-full bg-[#eeeef5] px-3 py-1.5 font-medium text-[#1b1b2d] transition-colors hover:bg-white"
              >
                Open app
              </FlowingCTA>
            </>
          ) : (
            <>
              <span className="mx-3 h-5 w-px bg-white/[0.12]" aria-hidden="true" />
              <HoverTextLink
                to={'/login'}
                text={'Log in'}
                className="text-sm px-3 text-white/70 transition-colors duration-300"
                dataCursor={'link'}
              />
              <FlowingCTA
                to="/signup"
                className="rounded-full bg-[#eeeef5] px-3 py-1.5 font-medium text-[#1b1b2d] transition-colors hover:bg-white"
              >
                Sign up
              </FlowingCTA>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
