let _pending: string | null = null;

export const setPendingService = (id: string) => { _pending = id; };
export const takePendingService = (): string | null => {
    const v = _pending;
    _pending = null;
    return v;
};
