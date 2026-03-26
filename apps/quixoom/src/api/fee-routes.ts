import { Router, type Request, type Response } from 'express';
import { getPool } from '../core/db.js';
import * as feeEngine from '../core/fee-engine.js';

export const feeRouter = Router();

// ============================================================================
// Fee Preview (what a creator would pay)
// ============================================================================
feeRouter.get('/preview', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const amount = parseFloat(req.query.amount as string);
    const creatorId = req.query.creator_id as string;

    if (!type || isNaN(amount)) {
      res.status(400).json({ error: 'type and amount are required' });
      return;
    }

    const preview = await feeEngine.preview(getPool(), type, amount, creatorId);
    res.json(preview);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Fee Configurations
// ============================================================================
feeRouter.get('/config', async (_req: Request, res: Response) => {
  const configs = await feeEngine.getAllFeeConfigs(getPool());
  res.json(configs);
});

feeRouter.patch('/config/:slug', async (req: Request, res: Response) => {
  try {
    const actor = req.headers['x-actor'] as string;
    if (!actor) { res.status(400).json({ error: 'x-actor header required' }); return; }

    const { fee_pct } = req.body;
    if (typeof fee_pct !== 'number' || fee_pct < 0 || fee_pct > 1) {
      res.status(400).json({ error: 'fee_pct must be between 0 and 1' });
      return;
    }

    await feeEngine.updateFeeConfig(getPool(), req.params.slug, fee_pct, actor);
    res.json({ status: 'updated', slug: req.params.slug, fee_pct });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// Revenue Dashboard
// ============================================================================
feeRouter.get('/revenue', async (req: Request, res: Response) => {
  try {
    const summary = await feeEngine.getRevenueSummary(getPool(), {
      from: req.query.from as string,
      to: req.query.to as string,
    });
    res.json(summary);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

feeRouter.get('/platform-balances', async (_req: Request, res: Response) => {
  const balances = await feeEngine.getPlatformBalances(getPool());
  res.json(balances);
});

// ============================================================================
// Creator Fee History
// ============================================================================
feeRouter.get('/history/:creatorId', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = await feeEngine.getCreatorFeeHistory(getPool(), req.params.creatorId, limit);
  res.json(history);
});
