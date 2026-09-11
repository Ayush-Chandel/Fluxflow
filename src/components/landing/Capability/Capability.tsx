import CapabilityPanels from "./CapabilityPanels"


function Capability() {
  return (
    <div className="mx-auto max-w-[1120px]   pt-20 lg:pt-50">
        <h2 className="mb-4 text-center text-4xl text-white md:mb-7 md:text-6xl">
            Everything you need
            <br className="hidden md:inline-block" /> to move work forward
        </h2>
        <CapabilityPanels/>
    </div>
  )
}

export default Capability