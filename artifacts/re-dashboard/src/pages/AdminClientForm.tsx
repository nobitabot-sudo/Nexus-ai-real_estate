import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import {
  useCreateAdminClient,
  useUpdateAdminClient,
  useListAdminClients,
  getListAdminClientsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function generateClientCode(name: string) {
  const prefix = name.replace(/[^A-Za-z0-9]/g, "").substring(0, 5).toUpperCase() || "AGNT";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

export default function AdminClientForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  
  const isNew = !params.id || params.id === "new";
  const clientId = !isNew ? parseInt(params.id as string, 10) : undefined;
  
  const { data: clients, isLoading: clientsLoading } = useListAdminClients({
    query: { enabled: !isNew }
  });
  
  const clientToEdit = clients?.find(c => c.id === clientId);

  const [formData, setFormData] = useState({
    name: "",
    clientCode: "",
    assistantId: "",
    niche: "",
    planType: "inbound",
    phoneNumberId: "",
    callLimit: "",
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (!isNew && clientToEdit && initializedForId.current !== clientId) {
      initializedForId.current = clientId!;
      setFormData({
        name: clientToEdit.name || "",
        clientCode: clientToEdit.clientCode || "",
        assistantId: clientToEdit.assistantId || "",
        niche: clientToEdit.niche || "",
        planType: clientToEdit.planType || "inbound",
        phoneNumberId: clientToEdit.phoneNumberId || "",
        callLimit: clientToEdit.callLimit?.toString() || "",
      });
    }
  }, [isNew, clientToEdit, clientId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate a client code for new clients if one hasn't been typed
      ...(isNew && !prev.clientCode ? { clientCode: generateClientCode(name) } : {})
    }));
  };

  const createMutation = useCreateAdminClient({
    mutation: {
      onSuccess: () => {
        toast.success("Client created successfully");
        queryClient.invalidateQueries({ queryKey: getListAdminClientsQueryKey() });
        setLocation("/admin");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to create client");
      }
    }
  });

  const updateMutation = useUpdateAdminClient({
    mutation: {
      onSuccess: () => {
        toast.success("Client updated successfully");
        queryClient.invalidateQueries({ queryKey: getListAdminClientsQueryKey() });
        setLocation("/admin");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to update client");
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.assistantId || (isNew && !formData.clientCode)) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isNew) {
      createMutation.mutate({
        data: {
          name: formData.name,
          clientCode: formData.clientCode,
          assistantId: formData.assistantId,
          niche: formData.niche || undefined,
          planType: formData.planType as "inbound" | "outbound" | "combo",
          phoneNumberId: formData.phoneNumberId || undefined,
          callLimit: formData.callLimit ? parseInt(formData.callLimit, 10) : undefined,
        }
      });
    } else if (clientId) {
      updateMutation.mutate({
        id: clientId,
        data: {
          name: formData.name,
          clientCode: formData.clientCode,
          assistantId: formData.assistantId,
          niche: formData.niche || undefined,
          planType: formData.planType as "inbound" | "outbound" | "combo",
          phoneNumberId: formData.phoneNumberId || undefined,
          callLimit: formData.callLimit ? parseInt(formData.callLimit, 10) : null,
        }
      });
    }
  };

  if (!isNew && clientsLoading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "Create Client" : "Edit Client"}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Configure the agency client and assign their VAPI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Client/Agency Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={handleNameChange}
                  placeholder="Acme Realty"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientCode">
                  Client Code * 
                  {isNew && <span className="text-xs font-normal text-muted-foreground ml-2">(Give this to the client to onboard)</span>}
                </Label>
                <Input 
                  id="clientCode" 
                  value={formData.clientCode} 
                  onChange={(e) => setFormData(prev => ({ ...prev, clientCode: e.target.value.toUpperCase() }))}
                  placeholder="ACME-1234"
                  className="font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assistantId">VAPI Assistant ID *</Label>
                <Input 
                  id="assistantId" 
                  value={formData.assistantId} 
                  onChange={(e) => setFormData(prev => ({ ...prev, assistantId: e.target.value }))}
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Niche / Focus (Optional)</Label>
                <Input 
                  id="niche" 
                  value={formData.niche} 
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  placeholder="e.g. Commercial, Luxury, Multi-family"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Plan Type</Label>
              <RadioGroup 
                value={formData.planType} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, planType: val }))}
                className="grid grid-cols-1 gap-4 md:grid-cols-3"
              >
                <div>
                  <RadioGroupItem value="inbound" id="inbound" className="peer sr-only" />
                  <Label
                    htmlFor="inbound"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                  >
                    <span className="font-semibold mb-1 text-base">Inbound</span>
                    <span className="text-xs text-muted-foreground text-center font-normal">Clients call in, AI answers and qualifies</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="outbound" id="outbound" className="peer sr-only" />
                  <Label
                    htmlFor="outbound"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                  >
                    <span className="font-semibold mb-1 text-base">Outbound</span>
                    <span className="text-xs text-muted-foreground text-center font-normal">AI calls your uploaded leads automatically</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="combo" id="combo" className="peer sr-only" />
                  <Label
                    htmlFor="combo"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                  >
                    <span className="font-semibold mb-1 text-base">Combo</span>
                    <span className="text-xs text-muted-foreground text-center font-normal">Both inbound answering + outbound lead calling</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(formData.planType === "outbound" || formData.planType === "combo") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId">VAPI Phone Number ID</Label>
                  <Input 
                    id="phoneNumberId" 
                    value={formData.phoneNumberId} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                    placeholder="123e4567-e89b..."
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Your VAPI phone number ID for placing outbound calls</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callLimit">Monthly Call Limit (Optional)</Label>
                  <Input 
                    id="callLimit" 
                    type="number"
                    min="1"
                    value={formData.callLimit} 
                    onChange={(e) => setFormData(prev => ({ ...prev, callLimit: e.target.value }))}
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-muted-foreground">Maximum successful calls allowed per month</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
            <Link href="/admin">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Client"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}