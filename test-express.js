const express = require('express');
const app = express();
const router = express.Router();
router.post('/test', (req, res) => res.send('ok'));
const mod = { default: router };
try {
  app.use('/api', mod);
  console.log("Mounted successfully");
} catch (e) {
  console.log("Error mounting:", e.message);
}
