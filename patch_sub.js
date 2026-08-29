import fs from 'fs';
const code = fs.readFileSync('src/lib/server/subscription-routes.ts', 'utf-8');
const patched = code.replace(
  /await supabase\.from\('subscriptions'\)\.upsert\(\{/,
  `const now = new Date();\n    const nextMonth = new Date();\n    nextMonth.setMonth(nextMonth.getMonth() + 1);\n    await supabase.from('subscriptions').upsert({\n      current_period_start: now.toISOString(),\n      current_period_end: nextMonth.toISOString(),`
);
fs.writeFileSync('src/lib/server/subscription-routes.ts', patched);
