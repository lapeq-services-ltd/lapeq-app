type ToastType = "error" | "success" | "info";
type Handler = (message: string, type: ToastType) => void;

let _handler: Handler | null = null;

export function _registerToastHandler(fn: Handler) {
    _handler = fn;
}

export function showToast(message: string, type: ToastType = "info") {
    _handler?.(message, type);
}
