import { useListAdminClients, useDeleteAdminClient, getListAdminClientsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, MoreHorizontal, Pencil, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: clients, isLoading } = useListAdminClients();
  const deleteMutation = useDeleteAdminClient({
    mutation: {
      onSuccess: () => {
        toast.success("Client deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListAdminClientsQueryKey() });
      },
      onError: (error) => {
        toast.error(error.error || "Failed to delete client");
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this client? This cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your white-label clients and their AI assistants.</p>
        </div>
        <Link href="/admin/clients/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Link>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Client Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assistant ID</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : clients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No clients found. Add your first client to get started.
                </TableCell>
              </TableRow>
            ) : (
              clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs bg-muted/50 py-1">{client.clientCode}</Badge>
                      <CopyButton value={client.clientCode} iconOnly />
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.isLinked ? (
                      <Badge variant="success" className="gap-1.5 pl-1.5 pr-2.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Linked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1.5 pl-1.5 pr-2.5 text-muted-foreground border-muted-foreground/30">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono truncate max-w-[200px]">
                    {client.assistantId}
                  </TableCell>
                  <TableCell>
                    {client.niche ? (
                      <Badge variant="secondary" className="font-normal">{client.niche}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/admin/clients/${client.id}/edit`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(client.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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