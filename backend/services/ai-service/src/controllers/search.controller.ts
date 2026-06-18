import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { sendSuccess, sendError } from '@procurement/utils';
import searchService from '../services/search.service';
import { resolveCallerScope } from '../services/rbac-scope.service';

export class SearchController {
  async search(req: IAuthenticatedRequest, res: Response) {
    try {
      const { query, category, topK } = req.body;
      const scope = await resolveCallerScope(req.user!);
      const result = await searchService.search(query, category || undefined, topK || 5, scope);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async indexDocument(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await searchService.indexDocument(req.params.documentId);
      return sendSuccess(res, result, 'Document indexed successfully', 201);
    } catch (error: any) {
      const code = error.message === 'Document not found' ? 404 : 400;
      return sendError(res, error.message, code);
    }
  }
}

export default new SearchController();
