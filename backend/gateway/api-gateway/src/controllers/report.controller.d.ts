import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
export declare class ReportController {
    vendorReport(req: IAuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    procurementReport(req: IAuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    invoiceReport(req: IAuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    contractReport(req: IAuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: ReportController;
export default _default;
//# sourceMappingURL=report.controller.d.ts.map