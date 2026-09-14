import TextReveal from "@/components/common/TextReveal"
import CapabilityPanels from "./CapabilityPanels"


function Capability() {
  return (
    <div className="mx-auto max-w-[1120px]   pt-20 lg:pt-50">
                <TextReveal
                                        mode="viewport"
                                        split='lines'
                                        stagger={0.08}
                                        duration={0.8}
                                        lines={[
                                          "Everything you need",
                                          "to move work forward"
                                        ]}
                                        className="mb-4 text-center text-4xl text-white md:mb-7 md:text-6xl" data-cursor="heading"
                                        parentClassname="mb-4 text-center"
                                        />
        <CapabilityPanels/>
    </div>
  )
}

export default Capability