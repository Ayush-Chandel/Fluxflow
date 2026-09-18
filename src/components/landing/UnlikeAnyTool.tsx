import { Button, Highlight } from "../common/Button";
import { CommandMenu } from "../common/CommandMenu";
import { Container } from "../common/Container";
import TextReveal from "../common/TextReveal";
import { Zap } from "./illustrations/Zap";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import glosslogo from "@/assets/finallogo.svg";

export const UnlikeAnyTool = () => (
  <div className="text-white max-w-[1450px] mx-auto sm:mt-24">
    <Container>
      <div className="text-center">
        <TextReveal
          mode="viewport"
          split="lines"
          stagger={0.08}
          duration={0.8}
          lines={["Unlike any tool", "you've used before"]}
          className="mb-4 md:mb-7 text-4xl md:text-6xl"
          dataCursor="heading"
        />
        <TextReveal
          mode="viewport"
          split="words"
          duration={0.8}
          stagger={0.01}
          delay={0.2}
          className=""
          dataCursor="description"
          parentClassname="justify-center mb-8 max-w-[680px] md:mb-7 text-md text-primary-text  md:text-lg"
        >
          Designed to the last pixel and engineered with unforgiving precision,
          Fluxflow combines UI elegance with world-class performance.
        </TextReveal>
      </div>
    </Container>
    <div className="flex flex-col gap-6 px-8 pb-8 md:flex-row md:flex-wrap md:overflow-hidden md:pb-12">
      <div className="relative flex min-h-[340px] w-full flex-col items-center justify-end overflow-hidden rounded-[32px] border border-transparent-white bg-glass-gradient p-6 text-center md:min-h-[480px] md:max-w-[calc(66.66%-12px)] md:shrink-0 md:basis-[calc(66.66%-12px)] md:rounded-[48px] md:p-14">
        <KeyboardShortcuts />
        <p className="mb-3 text-2xl md:mb-4 md:text-3xl">
          Built for your keyboard
        </p>
        <p className="text-md text-primary-text">
          Fly through your tasks with rapid-fire keyboard shortcuts for
          everything. Literally everything.
        </p>
      </div>
      <div className="relative flex min-h-[420px] w-full flex-col items-center justify-end overflow-hidden rounded-[32px] border border-transparent-white bg-glass-gradient p-6 text-center md:min-h-[480px] md:shrink-0 md:basis-[calc(33.33%-12px)] md:rounded-[48px] md:p-14">
        <div className="mask-linear-faded pointer-events-none absolute left-1/2 top-[-70px] w-[280px] -translate-x-1/2 [&>svg]:h-auto [&>svg]:w-full md:top-[-92px] md:w-[425px]">
          <Zap />
        </div>
        <p className="mb-3 text-2xl md:mb-4 md:text-3xl">Breathtakingly fast</p>
        <p className="text-md text-primary-text">
          Built for speed with 50ms interactions and real-time sync.
        </p>
      </div>
      <div className="group relative flex min-h-[400px] w-full flex-col items-center justify-end overflow-hidden rounded-[32px] border border-transparent-white bg-glass-gradient p-6 text-center md:min-h-[480px] md:shrink-0 md:basis-[calc(33.33%-12px)] md:rounded-[48px] md:p-14">
        <div className="pointer-events-none absolute left-1/2 top-[24px] w-[55%] max-w-[190px] -translate-x-1/2 md:left-[20px] md:top-[30px] md:w-[65%] md:max-w-none md:translate-x-0">
          {/* <LogoLightIllustration /> */}
          <img
            src={glosslogo}
            alt="Gloss logo"
            className="w-full object-contain [mask-image:linear-gradient(to_bottom,black,rgba(0,0,0,0.07)_60%,transparent_80%)] [-webkit-mask-image:linear-gradient(to_bottom,black,rgba(0,0,0,0.07)_60%,transparent_80%)]"
          />
        </div>
        <p className="mb-3 text-2xl md:mb-4 md:text-3xl">
          Designed for modern software teams
        </p>
        <p className="text-md text-primary-text">
          Comes with built-in workflows that create focus and routine.
        </p>
        <Button
          className="relative mt-6 md:absolute md:bottom-[200px] md:mt-0 md:translate-y-[30%] md:scale-[0.8] md:opacity-0 md:transition-[translate,scale,opacity] md:group-hover:translate-y-0 md:group-hover:scale-100 md:group-hover:opacity-100 [&_.highlight]:text-[11px]"
          variant="secondary"
          size="small"
          href="/"
        >
          <Highlight>Fluxflow Method</Highlight>
          Product principles
          <svg
            className="ml-1"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="#8A8F98"
          >
            <path d="M5.46967 11.4697C5.17678 11.7626 5.17678 12.2374 5.46967 12.5303C5.76256 12.8232 6.23744 12.8232 6.53033 12.5303L10.5303 8.53033C10.8207 8.23999 10.8236 7.77014 10.5368 7.47624L6.63419 3.47624C6.34492 3.17976 5.87009 3.17391 5.57361 3.46318C5.27713 3.75244 5.27128 4.22728 5.56054 4.52376L8.94583 7.99351L5.46967 11.4697Z"></path>
          </svg>
        </Button>
      </div>
      <div className="relative flex min-h-[480px] w-full flex-col items-center justify-start overflow-hidden rounded-[32px] border border-transparent-white bg-glass-gradient p-6 text-center md:min-h-[480px] md:max-w-[calc(66.66%-12px)] md:shrink-0 md:basis-[calc(66.66%-12px)] md:rounded-[48px] md:p-14">
        <CommandMenu />
        <div className="transition-opacity md:[.opened+&]:opacity-0">
          <p className="mb-3 text-2xl md:mb-4 md:text-3xl">
            Meet your command line
          </p>
          <p className="text-md text-primary-text">
            Complete any action in seconds with the global command menu.
          </p>
        </div>
      </div>
    </div>
  </div>
);
