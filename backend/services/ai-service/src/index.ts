import aiRoutes from './routes';

// Models + service singletons, exported by package name for the gateway / scripts.
export { InvoiceAnalysis } from './models/InvoiceAnalysis';
export { Feedback } from './models/Feedback';

export { default as invoiceAnalysisService } from './services/invoice-analysis.service';
export { default as feedbackService } from './services/feedback.service';

export default aiRoutes;
