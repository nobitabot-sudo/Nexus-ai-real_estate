import { useState } from "react";
import { Link } from "wouter";
import { useListCalls } from "@workspace/api-client-react";
import { formatDuration, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Phone, 
  PhoneOff, 
  PhoneMissed,
  ChevronRight,
  Filter,
  PlayCircle
} from "lucide-react";

export default function Calls() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: calls, isLoading } = useListCalls();

  const filteredCalls = calls?.filter(call => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (call.customerName?.toLowerCase() || "").includes(term) ||
      (call.customerPhone?.toLowerCase() || "").includes(term) ||
      (call.lead?.propertyType?.toLowerCase() || "").includes(term) ||
      (call.sentiment?.intent?.toLowerCase() || "").includes(term)
    );
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ended': return <PhoneOff className="h-4 w-4 text-emerald-500" />;
      case 'in-progress': return <Phone className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed': return <PhoneMissed className="h-4 w-4 text-red-500" />;
      default: return <Phone className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentBadge = (sentiment?: { label?: string | null }) => {
    if (!sentiment?.label) return null;
    const s = sentiment.label.toLowerCase();
    if (s === 'positive') return <Badge variant="success" className="capitalize">{s}</Badge>;
    if (s === 'negative') return <Badge variant="destructive" className="capitalize">{s}</Badge>;
    return <Badge variant="secondary" className="capitalize">{s}</Badge>;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Log</h1>
          <p className="text-muted-foreground mt-1">Review AI agent conversations and lead data.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, phone, intent..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : filteredCalls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  {searchTerm ? "No calls match your search." : "No calls recorded yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCalls.map((call) => (
                <TableRow key={call.id} className="group cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getStatusIcon(call.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {call.customerName || "Unknown Caller"}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-0.5">
                      {call.customerPhone || "No caller ID"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(call.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDuration(call.durationSeconds || 0)}
                  </TableCell>
                  <TableCell>
                    {call.sentiment?.intent ? (
                      <span className="text-sm font-medium">{call.sentiment.intent}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getSentimentBadge(call.sentiment)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {call.hasRecording && (
                        <PlayCircle className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      <Link href={`/calls/${call.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}