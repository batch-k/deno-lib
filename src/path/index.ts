import { } from 'https://deno.land/std/path/mod.ts'

const ConsectiveSlashRe = /[\\\/]/g;

const isUNC             = (path: string) => /^\\\\{2}|^\/\/{2}/.test(path);

const toSlashAll        = async (path: string) => path.replace(ConsectiveSlashRe, "/");
const toBackslashAll    = async (path: string) => path.replace(ConsectiveSlashRe, "\\");

export const path = {
    isUNC,
    toSlashAll, toBackslashAll
}