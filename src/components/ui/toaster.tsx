import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider data-oid="ylyxrd:">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} data-oid="_-4-na5">
            <div className="grid gap-1" data-oid="7wz0j36">
              {title && <ToastTitle data-oid="ijniz6k">{title}</ToastTitle>}
              {description && (
                <ToastDescription data-oid="c1en.7i">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose data-oid="ely:2vb" />
          </Toast>
        );
      })}
      <ToastViewport data-oid="4jus9yn" />
    </ToastProvider>
  );
}
