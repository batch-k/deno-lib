type ReadOptions = Omit<Deno.OpenOptions, "read" | "write">;
type WriteOptions = Omit<Deno.OpenOptions, "read" | "write">;

export const read  = (path: string | URL, options?: ReadOptions) => Deno.open(path, { ...options, read: true, write: false});
export const write = (path: string | URL, options?: WriteOptions) => Deno.open(path, { ...options, read: false, write: true});