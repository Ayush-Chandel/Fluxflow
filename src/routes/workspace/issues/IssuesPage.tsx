import { authService } from "@/services/authService"

function IssuesPage() {
  return (
    <div className="pl-20">
    <div className="text-foreground p-8">Issues — Step 4+</div>
  <button onClick={()=>{authService.signOut()}} className="text-black">Sign Out</button>
  </div>
  )
}

export { IssuesPage as Component }