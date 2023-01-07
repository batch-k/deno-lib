import { hash } from './index.ts'

console.log( await hash.sha1("ABCDEFG") );
console.log( await hash.sha256("ABCDEFG") );
console.log( await hash.sha512("ABCDEFG") );