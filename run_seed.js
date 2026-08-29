import { seedPlans } from './src/lib/server/seed.js';
seedPlans().then(() => console.log('Done')).catch(console.error);
