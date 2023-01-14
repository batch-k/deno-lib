const ReadFileEncodings = [
    "unicode-1-1-utf-8", "utf-8", "utf8",
    "utf-16be",
    "cssshiftjis", "ms_kanji", "shift-jis", "sjis", "windows-31j", "x-sjis",
    "cseucpkdfmtjapanese", "euc-jp", "x-euc-jp"
] as const;

const utf8Decoder       = new TextDecoder("utf-8");
const shiftJisDecoder   = new TextDecoder("shift-jis");
const eucJpDecoder      = new TextDecoder("shift-jis");

export const toUtf8     = (buffer: BufferSource, options?: TextDecodeOptions) => utf8Decoder.decode(buffer, options);
export const toShiftJis = (buffer: BufferSource, options?: TextDecodeOptions) => shiftJisDecoder.decode(buffer, options);
export const toEucJp    = (buffer: BufferSource, options?: TextDecodeOptions) => eucJpDecoder.decode(buffer, options);