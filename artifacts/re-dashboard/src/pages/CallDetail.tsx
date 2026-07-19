import { useParams, Link } from "wouter";
import { useGetCall, getGetCallQueryKey } from "@workspace/api-client-react";
import { formatDuration, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Home, 
  DollarSign, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function CallDetail() {
  const { id } = useParams();
  const { data: call, isLoading } = useGetCall(id as string, {
    query: { enabled: !!id, queryKey: getGetCallQueryKey(id as string) }
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Call not found.
      </div>
    );
  }

  const getSentimentColor = (label?: string | null) => {
    switch(label?.toLowerCase()) {
      case 'positive': return 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900';
      case 'negative': return 'text-red-600 bg-red-500/10 border-red-200 dark:border-red-900';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/calls">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {call.customerName || "Unknown Caller"}
            {call.status === "ended" && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-transparent">Completed</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-4 mt-1 font-mono">
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {call.customerPhone || "No ID"}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(call.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatDuration(call.durationSeconds || 0)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Summary, Recording, Transcript */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {call.recordingUrl && (
            <Card className="overflow-hidden border-primary/20 shadow-md">
              <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Call Recording</span>
              </div>
              <CardContent className="p-6 bg-card">
                <audio controls className="w-full h-12" src={call.recordingUrl}>
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Call Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4 text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {call.summary || "No summary available."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] w-full p-6">
                {call.messages && call.messages.length > 0 ? (
                  <div className="space-y-6">
                    {call.messages.filter(m => m.message).map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                        <span className="text-xs text-muted-foreground mb-1 font-medium px-1 uppercase tracking-wider">
                          {msg.role}
                        </span>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === 'assistant' 
                            ? 'bg-muted text-foreground rounded-tl-sm' 
                            : 'bg-primary text-primary-foreground rounded-tr-sm'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : call.transcript ? (
                  <div className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                    {call.transcript}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    No transcript available.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Lead Data, Action Items, Sentiment */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Intent</span>
                <Badge variant="secondary" className="text-sm px-3 py-1 font-medium">{call.sentiment?.intent || "Unknown"}</Badge>
              </div>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 block">Sentiment</span>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor(call.sentiment?.label)}`}>
                  {call.sentiment?.label || "Neutral"}
                  {call.sentiment?.score !== undefined && call.sentiment?.score !== null && (
                    <span className="ml-2 opacity-70">({call.sentiment.score})</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {(call.lead && Object.values(call.lead).some(v => v)) ? (
            <Card className="border-sidebar-primary/30 shadow-sm">
              <CardHeader className="pb-3 border-b bg-sidebar-primary/5">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <User className="h-5 w-5 text-sidebar-primary" /> 
                  Extracted Lead Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y divide-border/50 text-sm">
                  {call.lead.name && (
                    <div className="flex justify-between p-4">
                      <dt className="text-muted-foreground font-medium">Name</dt>
                      <dd className="font-semibold text-foreground text-right">{call.lead.name}</dd>
                    </div>
                  )}
                  {call.lead.location && (
                    <div className="flex justify-between p-4 bg-muted/20">
                      <dt className="text-muted-foreground font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Location</dt>
                      <dd className="font-semibold text-foreground text-right">{call.lead.location}</dd>
                    </div>
                  )}
                  {call.lead.propertyType && (
                    <div className="flex justify-between p-4">
                      <dt className="text-muted-foreground font-medium flex items-center gap-1.5"><Home className="h-3.5 w-3.5"/> Property</dt>
                      <dd className="font-semibold text-foreground text-right capitalize">{call.lead.propertyType}</dd>
                    </div>
                  )}
                  {call.lead.budget && (
                    <div className="flex justify-between p-4 bg-muted/20">
                      <dt className="text-muted-foreground font-medium flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5"/> Budget</dt>
                      <dd className="font-semibold text-foreground text-right">{call.lead.budget}</dd>
                    </div>
                  )}
                  {call.lead.bedrooms && (
                    <div className="flex justify-between p-4">
                      <dt className="text-muted-foreground font-medium">Bedrooms</dt>
                      <dd className="font-semibold text-foreground text-right">{call.lead.bedrooms}</dd>
                    </div>
                  )}
                  {call.lead.email && (
                    <div className="flex justify-between p-4 bg-muted/20">
                      <dt className="text-muted-foreground font-medium">Email</dt>
                      <dd className="font-semibold text-primary truncate max-w-[150px]" title={call.lead.email}>{call.lead.email}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          ) : null}

          {call.followUpActions && call.followUpActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Suggested Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-emerald-50/30 dark:bg-emerald-950/10">
                <ul className="space-y-3">
                  {call.followUpActions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground/90 leading-snug">
                      <div className="mt-0.5 min-w-[6px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {call.status === "failed" && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4 flex gap-3 text-red-800 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Call Failed</p>
                  <p>{call.endedReason || "The call dropped unexpectedly before completion."}</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}