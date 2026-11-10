import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { projectSchema } from '../src/schema.js';
mkdirSync('schemas', { recursive: true });
writeFileSync(
  'schemas/project.schema.json',
  JSON.stringify(z.toJSONSchema(projectSchema), null, 2) + '\n',
);
console.log('Wrote project JSON Schema. Cross-field invariants are also checked by the engine.');
