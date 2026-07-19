import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function SentimentBadge({ 
  label, 
  score, 
  className 
}: { 
  label?: string | null, 
  score?: number | null, 
  className?: string 
}) {
  if (!label) return <span className="text-muted-foreground text-xs">--</span>
  
  const normalized = label.toLowerCase()
  
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200"
  let dotClass = "bg-gray-500"
  
  if (normalized === "positive") {
    colorClass = "bg-green-50 text-green-700 border-green-200"
    dotClass = "bg-green-500"
  } else if (normalized === "neutral") {
    colorClass = "bg-gray-50 text-gray-700 border-gray-200"
    dotClass = "bg-gray-500"
  } else if (normalized === "negative") {
    colorClass = "bg-red-50 text-red-700 border-red-200"
    dotClass = "bg-red-500"
  }
  
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", colorClass, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  )
}
