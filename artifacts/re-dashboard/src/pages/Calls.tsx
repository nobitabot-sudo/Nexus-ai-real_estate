import * as React from "react"
import { useListCalls } from "@workspace/api-client-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/calls/StatusBadge"
import { SentimentBadge } from "@/components/calls/SentimentBadge"
import { formatSecondsToDuration } from "@/lib/formatters"
import { format } from "date-fns"
import { Search, PhoneOff, ChevronRight } from "lucide-react"
import { useLocation } from "wouter"

export default function Calls() {
  const [, setLocation] = useLocation()
  const [searchTerm, setSearchTerm] = React.useState("")
  const { data: calls, isLoading } = useListCalls()

  const filteredCalls = React.useMemo(() => {
    if (!calls) return []
    if (!searchTerm) return calls
    const lower = searchTerm.toLowerCase()
    return calls.filter(c => 
      c.customerName?.toLowerCase().includes(lower) || 
      c.customerPhone?.toLowerCase().includes(lower) ||
      c.summary?.toLowerCase().includes(lower) ||
      c.sentiment?.intent?.toLowerCase().includes(lower)
    )
  }, [calls, searchTerm])

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Calls</h1>
          <p className="text-muted-foreground mt-1">Review, search, and analyze all agent conversations.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, phone, intent..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PhoneOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No calls found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              {searchTerm ? "We couldn't find any calls matching your search." : "Your AI agent hasn't made any calls yet."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Lead Info</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead className="w-[300px]">Summary / Intent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow 
                  key={call.id} 
                  className="cursor-pointer group"
                  onClick={() => setLocation(`/calls/${call.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{call.customerName || call.lead?.name || "Unknown Lead"}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {call.customerPhone || call.lead?.phone || "--"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(call.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(call.createdAt), "h:mm a")}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {formatSecondsToDuration(call.durationSeconds)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={call.status} />
                  </TableCell>
                  <TableCell>
                    <SentimentBadge label={call.sentiment?.label} score={call.sentiment?.score} />
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="text-sm font-medium mb-1 truncate">
                      {call.sentiment?.intent || "General Inquiry"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {call.summary || "No summary available."}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
