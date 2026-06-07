import * as z from 'zod';

const schema = z.object({
  instagram_handle: z.string().nullable().optional().transform(v => (!v || v.trim() === '') ? null : v).refine(v => v === null || /^[a-zA-Z0-9_.]{1,30}$/.test(v), 'Handle inválido'),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).nullable().optional().transform(v => (!v || v.trim() === '') ? null : v),
});

console.log('Testing space in instagram:');
console.log(schema.safeParse({ instagram_handle: ' ', email: ' ' }));
