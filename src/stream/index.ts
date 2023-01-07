type OpenOption = Parameters<typeof Deno.open>;

const read  = (...[path, options]: Parameters<typeof Deno.open>) => Deno.open(path, options);
const write = (...[path, options]: Parameters<typeof Deno.open>) => Deno.open(path, options);

export const stream = {
    read,
    write
}