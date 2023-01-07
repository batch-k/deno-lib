import { encode } from 'https://deno.land/std/encoding/hex.ts'
import { crypto } from 'https://deno.land/std/crypto/mod.ts'

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

const sha1 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-1", textEncoder.encode(text));
    return textDecoder.decode(encode(new Uint8Array(digest)));
}

const sha256 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(text));
    return textDecoder.decode(encode(new Uint8Array(digest)));
}

const sha512 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-512", textEncoder.encode(text));
    return textDecoder.decode(encode(new Uint8Array(digest)));
}

export const hash = {
    sha1, sha256, sha512
}