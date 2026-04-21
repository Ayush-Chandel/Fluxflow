import { authService } from "@/services/authService"

function IssuesPage() {
  return <>
  <div className="text-foreground p-8">Issues — Step 4+</div>
  <button onClick={()=>{authService.signOut()}} className="text-black">Sign Out</button>
  </>
}

export { IssuesPage as Component }