const ConsectiveSlashRe     = /[\\\/]/g;
const SuffixSlashRe         = /[\\\/]+$/;
const ConsectivePeriodRe    = /\./g;

const isUNC             = (path: string) => /^\\\\{2}|^\/\/{2}/.test(path);

const toSlashAll        = (path: string) => path.replace(ConsectiveSlashRe, "/");
const toBackslashAll    = (path: string) => path.replace(ConsectiveSlashRe, "\\");

const basename          = (path: string) => path.split(ConsectiveSlashRe).slice(-1).join("");
const extname           = (path: string) => `.${basename(path).split(ConsectivePeriodRe).slice(-1).join("")}`;
const dirname           = (path: string) => path.replace(/[^\\\/]+$/g, "").replace(SuffixSlashRe, "");

export const path = {
    isUNC,
    toSlashAll, toBackslashAll,
    basename, extname, dirname
}