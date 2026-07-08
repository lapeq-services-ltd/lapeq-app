export function cleanErr(e: any): string {
    const msg: string = e?.message ?? e?.details ?? String(e ?? "");
    if (
        !msg ||
        msg.startsWith("{") ||
        msg.startsWith("[") ||
        msg.includes("504") ||
        msg.includes("503") ||
        msg.includes("502") ||
        msg.includes("Gateway") ||
        msg.includes("timeout") ||
        msg.includes("fetch failed")
    ) {
        return "Connection error. Please check your internet and try again.";
    }
    return msg;
}
