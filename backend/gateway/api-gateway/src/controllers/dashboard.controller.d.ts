import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
export declare class DashboardController {
    getStats(req: IAuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: DashboardController;
export default _default;
//# sourceMappingURL=dashboard.controller.d.ts.map