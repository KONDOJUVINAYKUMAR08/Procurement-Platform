import { Router } from 'express';
import { authenticate, authorize, validate, auditLog } from '@procurement/middleware';
import { ROLES } from '@procurement/types';
import invoiceController from '../controllers/invoice.controller';
import feedbackController from '../controllers/feedback.controller';
import { feedbackSchema } from '../validators';

const router: import('express').Router = Router();

// All AI routes require a valid JWT. (In the in-process gateway, the
// procurement/finance/document routers mounted before this one already apply a
// blanket authenticate to fall-through paths, so gating consistently here is
// both correct and simpler.)
router.use(authenticate);

// Authenticated liveness check — confirms the ai-service router is mounted and
// reports the configured Bedrock models (no secrets).
router.get('/ai/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: { service: 'ai-service', timestamp: new Date() },
  });
});

// ── Invoice Intelligence (Phase 1) ──────────────────────────────────────────
router.post(
  '/ai/invoices/:invoiceId/analyze',
  authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.PROCUREMENT_MANAGER, ROLES.AUDITOR),
  auditLog('ai_invoice_analyze', 'ai_invoice'),
  invoiceController.analyze
);
router.get(
  '/ai/invoices/:invoiceId',
  authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.PROCUREMENT_MANAGER, ROLES.AUDITOR, ROLES.VENDOR),
  auditLog('ai_invoice_view', 'ai_invoice'),
  invoiceController.getAnalysis
);

// ── Feedback (quality tracking) ─────────────────────────────────────────────
router.post(
  '/ai/feedback',
  validate(feedbackSchema),
  auditLog('ai_feedback', 'ai_feedback'),
  feedbackController.create
);

export default router;
