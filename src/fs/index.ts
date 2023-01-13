import { denoFs, BufReader, BufWriter } from '../deps.ts'
import { path as pathLib } from '../path/index.ts'
import { stream } from '../stream/index.ts'

const stat = (path: string) => Deno.stat(pathLib.toSlashAll(path));

const access = (path: string) => stat(path).then(() => {}).catch(error => { throw error });

const exists = (path: string) => access(path).then(() => true).catch(() => false);

const isDirectory = (path: string) => stat(path).then(({ isDirectory } ) => isDirectory).catch(() => false);

const isFile = (path: string) => stat(path).then(({ isFile } ) => isFile).catch(() => false);

const  itarableGenerator = <T>(data: Iterable<T>) => {
    return async function*(){
        for await (const value of data){
            yield value;
        }
    }
}

const  asyncItarableGenerator = <T>(data: AsyncIterable<T>) => {
    return async function*(){
        for await (const value of data){
            yield value;
        }
    }
}

// deno-lint-ignore no-namespace
export namespace DenoLibFs {
    export type ReadDirResult<T extends boolean | undefined = undefined> =
    T extends (false | undefined) ? ReturnType<typeof Deno.readDir> : AsyncIterable<string>;

    export type WalkResult<T extends boolean | undefined = undefined> =
    T extends (false | undefined) ? ReturnType<typeof denoFs.walk> : AsyncIterableIterator<string>;

    export type WalkOption<T extends boolean | undefined> = denoFs.WalkOptions & {
        pathOnly?: T
    }

    const ReadFileEncodings = [
        "unicode-1-1-utf-8", "utf-8", "utf8",
        "utf-16be",
        "cssshiftjis", "ms_kanji", "shift-jis", "sjis", "windows-31j", "x-sjis",
        "cseucpkdfmtjapanese", "euc-jp", "x-euc-jp"
    ] as const;

    export type ReadFileEncoding = typeof ReadFileEncodings[number];
}

const readDir = <T extends boolean | undefined = false>(path: string, pathOnly?: T): DenoLibFs.ReadDirResult<T> => {
    const slashAllPath = pathLib.toSlashAll(path);
    const result = Deno.readDir(slashAllPath);

    if(!pathOnly){ return <DenoLibFs.ReadDirResult<T>>result; }
    const generator = asyncItarableGenerator(result)();
    
    return <DenoLibFs.ReadDirResult<T>>{
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

const walk = <T extends boolean | undefined = false>(path: string, options?: DenoLibFs.WalkOption<T>): DenoLibFs.WalkResult<T> => {
    const { pathOnly, ..._options } = options ?? {};
    const slashAllPath = pathLib.toSlashAll(path);
    const result = denoFs.walk(slashAllPath, _options);
    if(!pathOnly){ return <DenoLibFs.WalkResult<T>>result; }

    const generator = asyncItarableGenerator(result)();
    return <DenoLibFs.WalkResult<T>>{
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

const walkDirectories = <T extends boolean | undefined = false>(
    path: string,
    options?: Omit<DenoLibFs.WalkOption<T>, "includeDirs" | "includeFiles">
): DenoLibFs.WalkResult<T> => {
    return <DenoLibFs.WalkResult<T>>walk(path, { ...options, includeFiles: false });
}

const walkFiles = <T extends boolean | undefined = false>(
    path: string,
    options?: Omit<DenoLibFs.WalkOption<T>, "includeDirs" | "includeFiles">
): DenoLibFs.WalkResult<T> => {
    return <DenoLibFs.WalkResult<T>>walk(path, { ...options, includeDirs: false });
}

const getTimestamp = (path: string) => stat(path).then(({ atime: lastAccess, mtime: lastModified }) => ({ lastAccess, lastModified }));
const setTimestamp = (path: string, lastAccess: Date, lastModified: Date) => Deno.utime(pathLib.toSlashAll(path), lastAccess, lastModified);

const createFileReader = (path: string, options?: Deno.OpenOptions) => stream.read(pathLib.toSlashAll(path), options);
const createFileWriter = (path: string, options?: Deno.OpenOptions) => stream.write(pathLib.toSlashAll(path), options);

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

const readFile = async (
    path: string,
    encoding: DenoLibFs.
    ReadFileEncoding = "utf-8"
): Promise<{ data: string; } | { data: string; error: Error; }> => {
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

const CopyFileStreamDefaultOption = { overwrite: true, copyTimeStamp: true, bufferSize: 32 };
const copyFileStream = async (src: string, dest: string, options: { overwrite: boolean, copyTimeStamp: boolean, bufferSize: number }) => {
    const s = pathLib.toSlashAll(src);
    const d = pathLib.toSlashAll(dest);
    const { overwrite, copyTimeStamp, bufferSize } = { ...CopyFileStreamDefaultOption, ...options };
    const readStream    = await stream.read(s, { read: true });
    const writeStream   = await stream.write(d, { write: true, create: true, createNew: !overwrite });
    const chunk = new Uint8Array(bufferSize);
    let eof = false;
    while(!eof){
        const readBytes = await readStream.read(chunk);
        eof = readBytes === null;
        const writeBytes = readBytes === null ? 0 : readBytes;
        await writeStream.write(chunk.slice(0, writeBytes));
    }

    writeStream.close();
    readStream.close();

    if(!copyTimeStamp){ return; }
    const { lastAccess, lastModified } = await getTimestamp(src);
    if(lastAccess === null || lastModified === null){
        throw new Error("Do not exists time stamp with source file, can't copy.");
    }

    await setTimestamp(src, lastAccess, lastModified);
}

export const fs = {
    stat, access, exists, isDirectory, isFile,
    readDir,
    walk, walkDirectories, walkFiles,

    readFileStream, readFile, writeFileStream, copyFileStream
}