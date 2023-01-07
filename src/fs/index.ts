import * as denoFs from 'https://deno.land/std/fs/mod.ts'
import { BufWriter, BufReader } from 'https://deno.land/std/io/mod.ts';
import { path as pathLib } from '../path/index.ts'
import { stream } from '../stream/index.ts'

const toSlashAll = (path: string) => pathLib.toSlashAll(path);

const stat = (path: string) => Deno.stat(toSlashAll(path));

const access = (path: string) => stat(path).then(() => {}).catch(error => { throw error });

const exists = (path: string) => access(path).then(() => true).catch(() => false);

const isDirectory = (path: string) => stat(path).then(({ isDirectory } ) => isDirectory).catch(() => false);

const isFile = (path: string) => stat(path).then(({ isFile } ) => isFile).catch(() => false);

const  asyncItarableGenerator = <T>(data: AsyncIterable<T>) => {
    return async function*(){
        for await (const value of data){
            yield value;
        }
    }
}

type ReadDirResult<T extends boolean | undefined = undefined> =
T extends (false | undefined) ? ReturnType<typeof Deno.readDir> : AsyncIterable<string>;

const readDir = <T extends boolean | undefined = false>(path: string, pathOnly?: T): ReadDirResult<T> => {
    const slashAllPath = toSlashAll(path);
    const result = Deno.readDir(slashAllPath);

    if(!pathOnly){ return <ReadDirResult<T>>result; }
    const generator = asyncItarableGenerator(result)();

    return <ReadDirResult<T>>{
        [Symbol.asyncIterator](){
            return {
                async next(){
                    const { done, value } = await generator.next();
                    if(done){ return { done, value }; }
                    const { name } = value;
                    return { done, value: `${slashAllPath}/${name}` }
                }
            }
        }
    }
}

type WalkResult<T extends boolean | undefined = undefined> =
T extends (false | undefined) ? ReturnType<typeof denoFs.walk> : AsyncIterableIterator<string>;

type WalkOption<T extends boolean | undefined> = denoFs.WalkOptions & {
    pathOnly?: T
}

const walk = <T extends boolean | undefined = false>(path: string, options?: WalkOption<T>): WalkResult<T> => {
    const { pathOnly, ..._options } = options ?? {};
    const slashAllPath = toSlashAll(path);
    const result = denoFs.walk(slashAllPath, _options);
    if(!pathOnly){ return <WalkResult<T>>result; }

    const generator = asyncItarableGenerator(result)();
    return <WalkResult<T>>{
        [Symbol.asyncIterator](){
            return {
                async next(){
                    const { done, value } = await generator.next();
                    if(done){ return { done, value }; }
                    const { path } = value;
                    return { done, value: path }
                }
            }
        }
    }
}

const walkDirectories = <T extends boolean | undefined = false>(path: string, options?: Omit<WalkOption<T>, "includeDirs" | "includeFiles">): WalkResult<T> => {
    return <WalkResult<T>>walk(path, { ...options, includeFiles: false });
}

const walkFiles = <T extends boolean | undefined = false>(path: string, options?: Omit<WalkOption<T>, "includeDirs" | "includeFiles">): WalkResult<T> => {
    return <WalkResult<T>>walk(path, { ...options, includeDirs: false });
}

const getTimestamp = (path: string) => stat(path).then(({ atime: lastAccess, mtime: lastModified }) => ({ lastAccess, lastModified }));
const setTimestamp = (path: string, lastAccess: Date, lastModified: Date) => Deno.utime(toSlashAll(path), lastAccess, lastModified);

const createFileReader = (path: string, options?: Deno.OpenOptions) => stream.read(toSlashAll(path), options);
const createFileWriter = (path: string, options?: Deno.OpenOptions) => stream.write(toSlashAll(path), options);

const readFileStream = async (path: string): Promise<{ data: Uint8Array; } | { data: Uint8Array; error: Error; }> => {
    let result = new Uint8Array(0);
    const delimiter = "\n";
    const delimiterBuffer = new Uint8Array(1);
    delimiterBuffer.set(new TextEncoder().encode(delimiter), 0);
    try{
        const stream = await createFileReader(path);
        const reader = new BufReader(stream, (await stream.stat()).size);
        let buffer: Uint8Array | null = new Uint8Array(0);
        while(buffer !== null){
            buffer = await reader.readSlice('\n'.charCodeAt(0));
            if(buffer === null){ break; }
            const temp = Uint8Array.from(result);
            const offset = result.length;
            result = new Uint8Array(temp.length + buffer.length);
            result.set(temp);
            result.set(buffer, offset);
        }
    }catch(error){
        return { data: result, error: error as Error}
    }

    return { data: result }
}

const ReadFileEncodings = [
    "unicode-1-1-utf-8", "utf-8", "utf8",
    "utf-16be",
    "cssshiftjis", "ms_kanji", "shift-jis", "sjis", "windows-31j", "x-sjis",
    "cseucpkdfmtjapanese", "euc-jp", "x-euc-jp"
] as const;
type ReadFileEncoding = typeof ReadFileEncodings[number];
const readFile = async (path: string, encoding: ReadFileEncoding = "utf-8"): Promise<{ data: string; } | { data: string; error: Error; }> => {
    const result = await readFileStream(path);
    if("error" in result){
        return { data: new TextDecoder(encoding).decode(result.data), error: result.error }
    }
    return { data: new TextDecoder(encoding).decode(result.data) }
}

const writeFileStream = async (path: string, data: string) => {
    const buffer = new TextEncoder().encode(data);

    const stream = await createFileWriter(path, { create: true, write: true, truncate: true });
    const writer = new BufWriter(stream);

    await writer.write(buffer);
    await writer.flush();
}

const CopyFileStreamOption = { overwrite: true, copyTimeStamp: true };
const copyFileStream = async (src: string, dest: string, options: { overwrite: boolean, copyTimeStamp: boolean }) => {
    const { overwrite, copyTimeStamp } = { ...CopyFileStreamOption, ...options };
    const [reader, writer] = await Promise.all([
        createFileReader(src),
        createFileWriter(dest, { create: true, createNew: !overwrite })
    ]);
    const bufWriter = new BufWriter(writer);
    for await(const chunk of reader.readable){ bufWriter.write(chunk); }
    await bufWriter.flush();
    if(!copyTimeStamp){ return; }
    const { lastAccess, lastModified } = await getTimestamp(src);
    if(lastAccess === null || lastModified === null){
        throw new Error("Do not exists time stamp with source file, can't copy.");
    }
    await setTimestamp(src, lastAccess, lastModified);
}

export const fs = {
    exists, isDirectory, isFile,
    readDir,
    walk, walkDirectories, walkFiles,

    readFileStream, readFile, writeFileStream, copyFileStream
}