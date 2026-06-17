import { invokeText, logger } from '@procurement/common';
import { Invoice, Payment } from '@procurement/finance-service';
import { PurchaseOrder, Contract } from '@procurement/procurement-service';
import { InvoiceAnalysis } from '../models/InvoiceAnalysis';
import { runInvoiceRules, RuleContext } from './rules/invoice-rules';

const toPlain = (doc: any) => (doc && typeof doc.toJSON === 'function' ? doc.toJSON() : doc);

export class InvoiceAnalysisService {
  /** Fetch the raw invoice (used by the controller for ownership checks). */
  async getInvoice(invoiceId: string) {
    return toPlain(await Invoice.get(invoiceId));
  }

  /**
   * Run the deterministic rule engine against an invoice, then ask Bedrock to
   * narrate the findings. Bedrock CANNOT change the score/level/findings — it
   * only fills `report` and `recommendations`.
   */
  async analyze(invoiceId: string, analyzedBy: string) {
    const invoice = toPlain(await Invoice.get(invoiceId));
    if (!invoice) throw new Error('Invoice not found');

    // Gather everything the rules need (scan-based, consistent with the rest of
    // the app; invoice volume is low).
    const allInvoices = (await Invoice.scan().exec()).map(toPlain);
    const otherInvoices = allInvoices.filter((i: any) => i._id !== invoiceId);

    let purchaseOrder = null;
    if (invoice.purchaseOrderId) {
      try { purchaseOrder = toPlain(await PurchaseOrder.get(invoice.purchaseOrderId)); } catch { /* not found */ }
    }
    let contract = null;
    if (invoice.contractId) {
      try { contract = toPlain(await Contract.get(invoice.contractId)); } catch { /* not found */ }
    }

    let paymentIds: string[] = [];
    try {
      const payments = await Payment.query('invoice').using('paymentInvoiceIndex').eq(invoiceId).exec();
      paymentIds = payments.map((p: any) => p._id);
    } catch (err) {
      logger.warn('Could not load payments for invoice analysis: ' + (err as Error).message);
    }

    // ── Deterministic engine ────────────────────────────────────────────────
    const ctx: RuleContext = { invoice, purchaseOrder, contract, otherInvoices };
    const ruleResult = runInvoiceRules(ctx);

    // ── Bedrock: narrate the findings only ──────────────────────────────────
    let report = '';
    let recommendations: string[] = [];
    try {
      const system =
        'You are a procurement finance audit assistant. You will be given the result of a deterministic invoice-validation rule engine. ' +
        'Write a concise, professional narrative summary for a finance reviewer and 2-4 specific, actionable recommendations. ' +
        'Do NOT invent additional findings and do NOT change the risk score. ' +
        'Respond ONLY with valid minified JSON of the form {"report": string, "recommendations": string[]}.';
      const prompt = JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        riskScore: ruleResult.riskScore,
        riskLevel: ruleResult.riskLevel,
        findings: ruleResult.findings,
      });
      const raw = await invokeText(prompt, system, 800);
      const parsed = this.safeParseJson(raw);
      report = typeof parsed?.report === 'string' ? parsed.report : raw;
      recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations.map(String) : [];
    } catch (err) {
      // Bedrock failure must not lose the deterministic result — degrade gracefully.
      logger.error('Bedrock narrative generation failed for invoice analysis: ' + (err as Error).message);
      report = ruleResult.findings.length
        ? `Automated rule checks flagged ${ruleResult.findings.length} issue(s); AI narrative is temporarily unavailable.`
        : 'No issues detected by the automated rule checks. AI narrative is temporarily unavailable.';
      recommendations = [];
    }

    const created = await InvoiceAnalysis.create({
      invoiceId,
      riskScore: ruleResult.riskScore,
      riskLevel: ruleResult.riskLevel,
      findings: ruleResult.findings,
      report,
      recommendations,
      ruleEngineVersion: ruleResult.ruleEngineVersion,
      crossCheckedAgainst: {
        purchaseOrderId: invoice.purchaseOrderId,
        contractId: invoice.contractId,
        paymentIds,
      },
      analyzedBy,
    });
    return toPlain(created);
  }

  /** Most recent analysis row for an invoice (or null). */
  async getLatest(invoiceId: string) {
    const rows = await InvoiceAnalysis.query('invoiceId')
      .using('invoiceAnalysisInvoiceIdIndex')
      .eq(invoiceId)
      .exec();
    if (!rows.length) return null;
    const sorted = rows
      .map(toPlain)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted[0];
  }

  private safeParseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      // Bedrock sometimes wraps JSON in ```json fences — strip and retry.
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* fall through */ }
      }
      return null;
    }
  }
}

export default new InvoiceAnalysisService();
