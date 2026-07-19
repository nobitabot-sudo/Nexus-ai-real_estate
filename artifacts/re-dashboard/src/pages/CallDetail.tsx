import * as React from "react"
import { useGetCall, getGetCallQueryKey } from "@workspace/api-client-react"
import { useParams, Link } from "wouter"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/calls/StatusBadge"
import { SentimentBadge } from "@/components/calls/SentimentBadge"
import { formatSecondsToDuration } from "@/lib/formatters"
import { format } from "date-fns"
import { 
  ArrowLeft, User, Phone, Mail, Home, DollarSign, 
  MapPin, BedDouble, PlayCircle, CheckSquare, MessageSquare, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

export default function CallDetail() {
  const { id } = useParams()
  
  const { data: call, isLoading, isError } = useGetCall(id || "", {
    query: {
      enabled: !!id,
      queryKey: getGetCallQueryKey(id || "")
    }
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !call) {
    return (
      <div className="p-8 w-full flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Call not found</h2>
        <p className="text-muted-foreground mb-6">This call record doesn't exist or you don't have access.</p>
        <Link href="/calls">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Calls</Button>
        </Link>
      </div>
    )
  }

  const name = call.customerName || call.lead?.name || "Unknown Lead"
  const phone = call.customerPhone || call.lead?.phone

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <Link href="/calls">
          <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Calls
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Call with {name}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground flex-wrap">
            <StatusBadge status={call.status} />
            <span>•</span>
            <span className="flex items-center">
              <Phone className="w-3 h-3 mr-1.5" />
              {format(new Date(call.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
            <span>•</span>
            <span className="font-mono">{formatSecondsToDuration(call.durationSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lead Info & Audio */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base flex items-center">
                <User className="w-4 h-4 mr-2 text-primary" /> Lead Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1">
                <InfoRow icon={User} label="Name" value={name} />
                <InfoRow icon={Phone} label="Phone" value={phone} />
                <InfoRow icon={Mail} label="Email" value={call.lead?.email} />
                <InfoRow icon={Home} label="Property Type" value={call.lead?.propertyType} />
                <InfoRow icon={MapPin} label="Location Interest" value={call.lead?.location} />
                <InfoRow icon={DollarSign} label="Budget" value={call.lead?.budget} />
                <InfoRow icon={BedDouble} label="Bedrooms" value={call.lead?.bedrooms} />
              </div>
            </CardContent>
          </Card>

          {call.recordingUrl && (
            <Card>
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-base flex items-center">
                  <PlayCircle className="w-4 h-4 mr-2 text-primary" /> Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <audio 
                  controls 
                  className="w-full h-12 rounded outline-none" 
                  src={call.recordingUrl}
                />
              </CardContent>
            </Card>
          )}

          {call.followUpActions && call.followUpActions.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center text-primary">
                  <CheckSquare className="w-4 h-4 mr-2" /> Follow-up Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {call.followUpActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-background border border-primary/30 flex-shrink-0 flex items-center justify-center text-primary text-xs mt-0.5">
                        {i + 1}
                      </div>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: AI Analysis & Transcript */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground">
                  {call.summary || "No summary available."}
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Sentiment & Intent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Sentiment Analysis</div>
                    <div className="flex items-center gap-3">
                      <SentimentBadge label={call.sentiment?.label} score={call.sentiment?.score} className="text-sm px-3 py-1" />
                      {call.sentiment?.score !== undefined && call.sentiment?.score !== null && (
                        <span className="text-sm font-mono text-muted-foreground">
                          Score: {call.sentiment.score.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  {call.sentiment?.intent && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Primary Intent</div>
                      <div className="text-sm font-medium bg-muted inline-flex px-2 py-1 rounded-md">
                        {call.sentiment.intent}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1 flex flex-col h-[500px]">
            <CardHeader className="pb-4 border-b border-border bg-muted/10">
              <CardTitle className="text-base flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" /> Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="p-6 space-y-6">
                {call.messages && call.messages.length > 0 ? (
                  call.messages.map((msg, idx) => {
                    const isAgent = msg.role.toLowerCase() === 'agent' || msg.role.toLowerCase() === 'system';
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex flex-col max-w-[85%]",
                          isAgent ? "mr-auto" : "ml-auto items-end"
                        )}
                      >
                        <div className="text-xs text-muted-foreground mb-1 px-1 font-medium">
                          {isAgent ? "AI Assistant" : (name)}
                        </div>
                        <div 
                          className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed",
                            isAgent 
                              ? "bg-muted text-foreground rounded-tl-sm" 
                              : "bg-primary text-primary-foreground rounded-tr-sm"
                          )}
                        >
                          {msg.message}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                    <p>Transcript is not available for this call.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
