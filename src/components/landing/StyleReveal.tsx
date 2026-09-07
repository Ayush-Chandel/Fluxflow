
import { motion } from "motion/react";
import glosslogo from "@/assets/glosslogotransparent.png";

type Props = {}

function StyleReveal({}: Props) {
    //check
  return (
    <div className="flex items-center justify-center pt-20 pb-10">
        <motion.div
          initial={{
            opacity: 0,
            y: "20%",
            rotate: 40,
            filter: "contrast(400%) blur(4px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            rotate: 0,
            filter: "contrast(100%) blur(0px)",
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className="relative h-86 w-86"
          style={{
            mixBlendMode: "lighten",
            maskImage: "linear-gradient(black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(black 60%, transparent 100%)",
          }}
        >
          <img
            src={glosslogo}
            alt="Gloss logo"
            className="h-full w-full object-contain"
          />
        </motion.div>
      </div>
  )
}

export default StyleReveal