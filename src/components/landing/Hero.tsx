
import TextReveal from '../common/TextReveal'
import StyleReveal from './StyleReveal'

type Props = {}

function Hero({}: Props) {
  return (
      <section className='max-w-[1200px] mx-auto'>
        <StyleReveal/>
        <div className="mx-auto max-w-3xl px-6 pb-12 text-center">
            <TextReveal
              mode="viewport"
              duration={0.8}
              className="text-5xl font-medium tracking-tight bg-[linear-gradient(103.97deg,rgb(255,255,255)_2.99%,rgba(255,255,255,0.38)_91.33%)] bg-clip-text text-transparent sm:text-7xl" 
              dataCursor='heading'
              >
                Built for scale
              </TextReveal>
                <TextReveal
                    mode="viewport"
                    split='words'
                    duration={0.8}
                    stagger={0.01}
                    delay={0.2}
                    className="" dataCursor='description'
                    parentClassname={ 'mx-auto mt-8 max-w-2xl text-lg leading-7 text-slate-300 sm:text-xl sm:leading-8 justify-center'}
                    >
                                  FluxFlow gives people and AI agents one clear place to plan work,
                  shape projects, and move issues from idea to done together. To support product teams, we’ve been working on Fluxflow built for scale.
                </TextReveal>
        </div>
      </section>
  )
}

export default Hero