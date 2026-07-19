import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  const normalized = status.toLowerCase()
  
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200"
  
  if (normalized === "ended" || normalized === "completed") {
    colorClass = "bg-green-100 text-green-800 border-green-200"
  } else if (normalized === "in-progress" || normalized === "active") {
    colorClass = "bg-blue-100 text-blue-800 border-blue-200"
  } else if (normalized === "failed" || normalized === "error") {
    colorClass = "bg-red-100 text-red-800 border-red-200"
  }
  
  return (
    <Badge variant="outline" className={cn("font-medium", colorClass, className)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
