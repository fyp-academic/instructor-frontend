import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast({ title, description, variant = "default", duration = 4000 }: ToastProps) {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      duration,
    });
  } else {
    sonnerToast.success(title, {
      description,
      duration,
    });
  }
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { useToast, toast };
