import { hexEncode, crypto } from '../deps.ts'

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

type RandomValueType = "Int8" | "Int16" | "Int32" | "Uint8" | "Uint16" | "Uint32" | "Uint8Clamped" | "BigInt64" | "BigUint64";
type GetRandomValuesResult<T extends RandomValueType = "Uint8"> =
T extends "Int8" ? Int8Array :
T extends "Int16" ? Int16Array :
T extends "Int32" ? Int32Array :
T extends "Uint8" ? Uint8Array :
T extends "Uint16" ? Uint16Array :
T extends "Uint32" ? Uint32Array :
T extends "Uint8Clamped" ? Uint8ClampedArray :
T extends "BigInt64" ? BigInt64Array :
T extends "BigUint64" ? BigUint64Array :
Int8Array;

export const getRandomValues = <T extends RandomValueType = "Uint8">(length: number, type?: T)  => {
    return <GetRandomValuesResult<T>>crypto.getRandomValues(
        type === "Int8"                 ?   new Int8Array(length) :
        type === "Int16"                ?   new Int16Array(length) :
        type === "Int32"                ?   new Int32Array(length) :
        type === "Uint8"                ?   new Uint8Array(length) :
        type === "Uint16"               ?   new Uint16Array(length) :
        type === "Uint32"               ?   new Uint32Array(length) :
        type === "Uint8Clamped"         ?   new Uint8ClampedArray(length) :
        type === "BigInt64"             ?   new BigInt64Array(length) :
        type === "BigUint64"            ?   new BigUint64Array(length) :
                                            new Uint8Array(length)
    );
}

export const getUUID = () => crypto.randomUUID();

export const getSha1 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-1", textEncoder.encode(text));
    return textDecoder.decode(hexEncode(new Uint8Array(digest)));
}

export const getSha256 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(text));
    return textDecoder.decode(hexEncode(new Uint8Array(digest)));
}

export const getSha512 = async (text: string) => {
    const digest = await crypto.subtle.digest("SHA-512", textEncoder.encode(text));
    return textDecoder.decode(hexEncode(new Uint8Array(digest)));
}