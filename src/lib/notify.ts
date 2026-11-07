// Avisos e confirmações dentro do próprio CRM, no lugar de alert()/confirm()
// do navegador (que abrem aquela janela "crm.persianasfoz.com.br diz").
// Uso:
//   notify.success("Salvo!")        notify.error("Falhou: ...")
//   if (!(await confirmDialog({ message: "Excluir?", danger: true }))) return;
// O <NotificationHost /> (montado no layout) é quem desenha na tela.

export type ToastKind = "success" | "error" | "warning" | "info";
export type Toast = { id: number; kind: ToastKind; message: string };

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};
export type ConfirmRequest = ConfirmOptions & { id: number; resolve: (ok: boolean) => void };

type State = { toasts: Toast[]; confirm: ConfirmRequest | null };

let state: State = { toasts: [], confirm: null };
const listeners = new Set<() => void>();
let nextId = 1;

const emit = () => listeners.forEach((l) => l());
const setState = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

export const notificationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
};

export function dismissToast(id: number) {
  setState({ toasts: state.toasts.filter((t) => t.id !== id) });
}

function push(kind: ToastKind, message?: string | null) {
  if (!message) message = kind === "error" ? "Ocorreu um erro. Tente novamente." : "Pronto.";
  const id = nextId++;
  setState({ toasts: [...state.toasts, { id, kind, message }].slice(-4) });
  // erros ficam um pouco mais na tela
  setTimeout(() => dismissToast(id), kind === "error" ? 7000 : 4000);
}

export const notify = {
  success: (message?: string | null) => push("success", message),
  error: (message?: string | null) => push("error", message),
  warning: (message?: string | null) => push("warning", message),
  info: (message?: string | null) => push("info", message),
};

export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    // se já houver uma confirmação aberta, a anterior é cancelada
    state.confirm?.resolve(false);
    setState({ confirm: { ...opts, id: nextId++, resolve } });
  });
}

export function answerConfirm(ok: boolean) {
  const current = state.confirm;
  if (!current) return;
  setState({ confirm: null });
  current.resolve(ok);
}
