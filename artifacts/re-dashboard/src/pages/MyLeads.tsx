import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  useListMyLeads, 
  getListMyLeadsQueryKey 
} from "@workspace/api-client-react";
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
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileDown, Eye, Loader2 } from "lucide-react";

export default function MyLeads() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: leads, isLoading, refetch } = useListMyLeads();

  const isCalling = leads?.some((l) => l.status === "calling");

  useEffect(() => {
    let interval: number;
    if (isCalling) {
      interval = window.setInterval(() => {
        refetch();
      }, 15000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isCalling, refetch]);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid .csv file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/api/clients/me/leads/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload leads");
      }

      const data = await res.json();
      toast.success(`${data.count || 'Your'} leads uploaded. VAPI is calling each one now.`);
      queryClient.invalidateQueries({ queryKey: getListMyLeadsQueryKey() });
    } catch (err: any) {
      toast.error(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const generateSampleCSV = () => {
    const headers = "firstName,lastName,phone,email,notes\n";
    const row = "John,Doe,+15551234567,john@example.com,Interested in buying a 3-bed house\n";
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (secs: number | null | undefined) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}m ${s}s`;
  };

  const totalLeads = leads?.length || 0;
  const pendingLeads = leads?.filter(l => l.status === "pending").length || 0;
  const callingLeads = leads?.filter(l => l.status === "calling").length || 0;
  const calledLeads = leads?.filter(l => l.status === "called").length || 0;
  const completedLeads = leads?.filter(l => l.status === "completed").length || 0;
  const failedLeads = leads?.filter(l => l.status === "failed").length || 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Leads</h1>
        <p className="text-muted-foreground mt-1">
          Upload your lead list — your AI agent calls each one automatically
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div 
          className={`p-10 text-center border-2 border-dashed m-6 rounded-lg transition-colors ${
            dragActive ? 'border-amber-400 bg-amber-400/5' : 'border-muted-foreground/20 hover:border-amber-400/50 hover:bg-muted/50'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${dragActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <h3 className="text-lg font-semibold mb-2">Upload CSV to start calling</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Drag and drop your CSV file here, or click to browse. Expected columns: 
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">firstName</span>
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">lastName</span>(opt),
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">phone</span>,
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">email</span>(opt),
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mx-1">notes</span>(opt).
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            disabled={isUploading}
          />
          
          <div className="flex items-center justify-center gap-4">
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                "Select File"
              )}
            </Button>
            <Button variant="outline" onClick={generateSampleCSV} disabled={isUploading}>
              <FileDown className="mr-2 h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 py-2">
        <Badge variant="outline" className="px-3 py-1 text-sm bg-card">Total: {totalLeads}</Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">Pending: {pendingLeads}</Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">Calling: {callingLeads}</Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">Called: {calledLeads}</Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Completed: {completedLeads}</Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">Failed: {failedLeads}</Badge>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Call Result</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No leads yet. Upload a CSV to get started.
                </TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.firstName} {lead.lastName}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.email || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {lead.status === "pending" && <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Pending</Badge>}
                    {lead.status === "calling" && <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 animate-pulse">Calling</Badge>}
                    {lead.status === "called" && <Badge variant="warning" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">Called</Badge>}
                    {lead.status === "completed" && <Badge variant="success" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">Completed</Badge>}
                    {lead.status === "failed" && <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">Failed</Badge>}
                    {lead.status === "dnc" && <Badge variant="outline" className="text-slate-500 border-slate-300">DNC</Badge>}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={lead.callSummary || ""}>
                    {lead.callSummary ? (
                      lead.callSummary.length > 80 ? `${lead.callSummary.substring(0, 80)}...` : lead.callSummary
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.callSentiment === "positive" && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-xs capitalize">{lead.callSentiment}</span></div>}
                    {lead.callSentiment === "neutral" && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" /> <span className="text-xs capitalize">{lead.callSentiment}</span></div>}
                    {lead.callSentiment === "negative" && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-xs capitalize">{lead.callSentiment}</span></div>}
                    {!lead.callSentiment && <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {formatDuration(lead.callDurationSeconds)}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.vapiCallId ? (
                      <Link href={`/calls/${lead.vapiCallId}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Call</span>
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground px-4">—</span>
                    )}
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
