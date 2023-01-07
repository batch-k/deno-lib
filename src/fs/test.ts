import { fs } from './index.ts'

const path = "/Users/urabayashi-work/develop/deno/lib";
const result = fs.walk(path);

const { data, error } = await fs.readFile(`${path}/bundle.js`)

console.log(data)