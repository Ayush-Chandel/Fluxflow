import { authService } from "@/services/authService"

authService

type Props = {}

function Cycles({}: Props) {
  return (
     <div className="pl-20">
        <div className="text-foreground p-8">Cycles</div>
      <button onClick={()=>{authService.signOut()}} className="text-black">Sign Out</button>
      </div>
  )
}

export { Cycles as Component }