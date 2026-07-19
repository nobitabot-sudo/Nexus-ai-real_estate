import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">404</h1>
      <h2 className="text-xl font-medium text-muted-foreground mb-6">Page not found</h2>
      <p className="text-muted-foreground max-w-sm text-center mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  )
}
