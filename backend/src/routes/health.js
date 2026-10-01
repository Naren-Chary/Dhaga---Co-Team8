import { Router } from 'express';
import { checkSupabaseConnection, isSupabaseConfigured } from '../config/supabase.js';
import { getAIConfigStatus } from '../config/openrouter.js';

const router = Router();

router.get('/', async (req, res) => {
  const supabaseHealth = await checkSupabaseConnection();
  const aiHealth = getAIConfigStatus();

  const isHealthy = supabaseHealth.connected && aiHealth.configured;

  res.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Dhaga & Co. RTO Intelligence API',
    version: '1.0.0',
    phase: 'Phase 1 - Project Foundation',
    integrations: {
      supabase: {
        configured: isSupabaseConfigured(),
        ...supabaseHealth,
      },
      openrouter: {
        ...aiHealth,
      },
    },
    systemMetrics: {
      uptimeSeconds: process.uptime(),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});

export default router;
