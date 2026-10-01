import { Router } from 'express';
import { getComprehensiveAnalytics } from '../services/analyticsService.js';

const router = Router();

/**
 * GET /api/analytics/overview
 * Returns complete outcome tracking, baseline comparison, category fit insights, and vendor ranking.
 */
router.get('/overview', async (req, res) => {
  try {
    const analytics = await getComprehensiveAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('[Analytics API] Error computing analytics:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
