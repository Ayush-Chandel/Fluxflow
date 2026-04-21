import React from 'react'

type Props = {
    children: React.ReactNode
}

function BoxGradient({ children }: Props) {
  return (
    <div className="relative min-h-screen">

      {/* Grid layer — mask applied ONLY here */}
      <div className="fixed inset-0
        bg-[linear-gradient(to_right,#e0e6ec_1px,transparent_1px),linear-gradient(to_bottom,#e0e6ec_1px,transparent_1px)]
        bg-[size:6rem_4rem]
        [mask-image:radial-gradient(ellipse_50%_70%_at_50%_50%,transparent_40%,black_100%)]"
      />

      {/* Children — completely separate, no mask */}
      <div className="relative z-10 flex justify-center items-start mx-4">
        {children}
      </div>

    </div>
  )
}

export default BoxGradient
