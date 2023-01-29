const ConsectiveSlashRe     = /[\\\/]/g;
const SuffixSlashRe         = /[\\\/]+$/;
const ConsectivePeriodRe    = /\./g;

export const isUNC             = (path: string) => /^\\\\{2}|^\/\/{2}/.test(path);

export const toSlashAll        = (path: string) => path.replace(ConsectiveSlashRe, "/");
export const toBackslashAll    = (path: string) => path.replace(ConsectiveSlashRe, "\\");

export const basename          = (path: string) => path.split(ConsectiveSlashRe).slice(-1).join("");
export const extname           = (path: string) => `.${basename(path).split(ConsectivePeriodRe).slice(-1).join("")}`;
export const dirname           = (path: string) => path.replace(/[^\\\/]+$/g, "").replace(SuffixSlashRe, "");

export const script             = new URL(import.meta.url).pathname;
export const exe                = Deno.execPath();