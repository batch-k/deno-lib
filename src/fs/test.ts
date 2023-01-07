import { fs } from './index.ts'

const path = "/Users/urabayashi-work/develop/deno/lib/src";
const result = fs.walk(path);

const { data, error } = await fs.readFileStream(`${path}/streamText.txt`)
console.log( new TextDecoder("utf-8").decode(data) );
console.log([
    "あいうえお",
    "かきくけこ",
    "サシスセソ"
].join("\n"));
// fs.writeFileStream(`${path}/streamText.txt`, "あいうえお");