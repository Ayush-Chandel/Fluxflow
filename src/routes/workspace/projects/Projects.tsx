import { authService } from "@/services/authService"

type Props = {}

function Projects({}: Props) {
  return (
     <div className="pl-20">
        <div className="text-foreground p-8">Projects</div>
      <button onClick={()=>{authService.signOut()}} className="text-black">Sign Out</button>
      </div>
  )
}

export { Projects as Component }