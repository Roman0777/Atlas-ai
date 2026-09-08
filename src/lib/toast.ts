import { toast as sonnerToast } from "sonner";

/**
 * Glass-morphism toast helpers — wraps sonner with Atlas styling.
 * All toasts automatically get the glass treatment from CSS.
 */
export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, {
      ...opts,
      className: "toast-success",
    }),

  error: (message: string, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, {
      ...opts,
      className: "toast-error",
    }),

  info: (message: string, opts?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, {
      ...opts,
      className: "toast-info",
    }),

  warning: (message: string, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, {
      ...opts,
      className: "toast-warning",
    }),

  promise: typeof sonnerToast.promise,

  dismiss: sonnerToast.dismiss,

  custom: sonnerToast.custom,
};
