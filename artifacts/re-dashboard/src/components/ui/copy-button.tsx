import { ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  iconOnly?: boolean;
}

export function CopyButton({ value, className, iconOnly = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground h-8",
        iconOnly ? "w-8 p-0" : "px-3 gap-2",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {!iconOnly && <span>{copied ? "Copied" : "Copy"}</span>}
    </button>
  );
}