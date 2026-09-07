
import StyleReveal from './StyleReveal'

type Props = {}

function Hero({}: Props) {
  return (
      <section>
        <StyleReveal/>
        <div className="mx-auto max-w-3xl px-6 pb-24 text-center">
            <h1 className="text-5xl font-medium tracking-tight bg-[linear-gradient(103.97deg,rgb(255,255,255)_2.99%,rgba(255,255,255,0.38)_91.33%)] bg-clip-text text-transparent sm:text-7xl">
            Built for scale
            </h1> 
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-7 text-slate-300 sm:text-xl sm:leading-8">
            FluxFlow gives people and AI agents one clear place to plan work,
            shape projects, and move issues from idea to done together. To support product teams, we’ve been working on Fluxflow built for scale.
            </p>
        </div>
      </section>
  )
}

export default Hero