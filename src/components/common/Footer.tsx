import FlowingCTA from "./FlowingCTA";
import HoverTextLink from "./HoverTextLink";
import { GithubIcon, LinkedinIcon, YoutubeIcon } from "@/components/icons";

const footerLinks = [
	"Services",
	"Build",
	"About",
	"Agents",
	"Workflow",
	"Contacts",
];

const socialLinks = [
	{ label: "GitHub", href: "https://github.com/Ayush-Chandel", Icon: GithubIcon },
	{ label: "LinkedIn", href: "https://www.linkedin.com/in/ayushchandel10", Icon: LinkedinIcon },
	{ label: "YouTube", href: "#", Icon: YoutubeIcon },
];

export default function Footer() {
	return (
		<footer className="bg-[#010213] text-white px-8 border-t border-white/[0.08]">
			<div className="mx-auto flex min-h-[400px] max-w-[1200px] flex-col justify-between px-6 py-16 sm:py-20 lg:px-0">
				<div className="grid gap-14 md:grid-cols-[1fr_auto] md:gap-24">
					<div className="">
						<FlowingCTA
							to="/login"
							aria-label="Log in to Fluxflow"
							className="rounded-full bg-[#eeeef5] px-5 font-medium text-[#1b1b2d] transition-colors hover:bg-white"
						>
							Log in
						</FlowingCTA>
						<p className="mt-7 max-w-xs text-sm leading-6 text-white/55">
							Fluxflow brings issues, projects, and team workflows together in one clear place.
						</p>
					</div>

					<nav
						className="grid grid-cols-2 content-start gap-x-14 gap-y-5 text-lg text-white sm:gap-x-20"
						aria-label="Footer navigation"
					>
						{footerLinks.map((label) => (
							<HoverTextLink
								key={label}
								to="#"
								text={label}
								className="text-white/90 transition-colors duration-300 hover:text-white"
								dataCursor="link"
							/>
						))}
					</nav>
				</div>

				<div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
					<div className="flex items-center gap-5 text-xs">
						<a
							href="#"
							className="text-white transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						>
							Privacy Policy
						</a>
						<span className="text-white/40">{new Date().getFullYear()}, Fluxflow</span>
					</div>

					<div className="flex items-center gap-4" aria-label="Social links">
						{socialLinks.map(({ label, href, Icon }) => (
							<a
								key={label}
								href={href}
								aria-label={label}
								className="flex size-12 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
							>
								<Icon size={17} />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
