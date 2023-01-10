import { path } from './index.ts'


console.log( path.basename("abc\\def\\ghi") );
console.log( path.extname("abc\\def\\ghi\\database.sqlite.realm") );
console.log( path.dirname("abc/def/ghi") );
console.log( path.dirname("abc//def//ghi//") );
console.log( path.dirname("abc\\def\\ghi") );
console.log( path.dirname("abc\\def\\ghi\\") );

console.log( path.script );
console.log( path.exe );
