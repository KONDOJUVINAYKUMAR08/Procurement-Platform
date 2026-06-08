"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const common_1 = require("@procurement/common");
const identity_service_1 = __importDefault(require("@procurement/identity-service"));
const procurement_service_1 = __importDefault(require("@procurement/procurement-service"));
const finance_service_1 = __importDefault(require("@procurement/finance-service"));
const document_service_1 = __importDefault(require("@procurement/document-service"));
const dashboard_controller_1 = __importDefault(require("./controllers/dashboard.controller"));
const report_controller_1 = __importDefault(require("./controllers/report.controller"));
const middleware_1 = require("@procurement/middleware");
const types_1 = require("@procurement/types");
async function bootstrap() {
    try {
        if (process.env.NODE_ENV === 'production') {
            try {
                const secrets = await (0, common_1.getSecrets)();
                (0, common_1.updateConfig)(secrets);
                common_1.logger.info('Successfully loaded secrets from AWS Secrets Manager');
            }
            catch (err) {
                common_1.logger.error('Failed to load secrets, falling back to environment variables', err);
            }
        }
        await (0, common_1.connectDatabase)();
        const app = (0, express_1.default)();
        app.use((0, helmet_1.default)());
        app.use((0, compression_1.default)());
        app.use((0, cookie_parser_1.default)());
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        app.use((0, cors_1.default)({
            origin: common_1.config.corsOrigin,
            credentials: true,
        }));
        app.use((0, morgan_1.default)('combined', {
            stream: { write: (message) => common_1.logger.info(message.trim()) },
        }));
        // API Routes
        const apiRouter = express_1.default.Router();
        // Gateway Aggregation Routes
        apiRouter.get('/dashboard', middleware_1.authenticate, dashboard_controller_1.default.getStats);
        apiRouter.get('/reports/vendors', middleware_1.authenticate, (0, middleware_1.authorize)(types_1.ROLES.ADMIN, types_1.ROLES.PROCUREMENT_MANAGER, types_1.ROLES.FINANCE, types_1.ROLES.AUDITOR), report_controller_1.default.vendorReport);
        apiRouter.get('/reports/procurement', middleware_1.authenticate, (0, middleware_1.authorize)(types_1.ROLES.ADMIN, types_1.ROLES.PROCUREMENT_MANAGER, types_1.ROLES.FINANCE, types_1.ROLES.AUDITOR), report_controller_1.default.procurementReport);
        apiRouter.get('/reports/invoices', middleware_1.authenticate, (0, middleware_1.authorize)(types_1.ROLES.ADMIN, types_1.ROLES.PROCUREMENT_MANAGER, types_1.ROLES.FINANCE, types_1.ROLES.AUDITOR), report_controller_1.default.invoiceReport);
        apiRouter.get('/reports/contracts', middleware_1.authenticate, (0, middleware_1.authorize)(types_1.ROLES.ADMIN, types_1.ROLES.PROCUREMENT_MANAGER, types_1.ROLES.FINANCE, types_1.ROLES.AUDITOR), report_controller_1.default.contractReport);
        // Service Routes
        apiRouter.use(identity_service_1.default);
        apiRouter.use(procurement_service_1.default);
        apiRouter.use(finance_service_1.default);
        apiRouter.use(document_service_1.default);
        app.use('/api', apiRouter);
        // Health check
        app.get('/api/health', (req, res) => {
            res.status(200).json({ status: 'ok', service: 'api-gateway', timestamp: new Date() });
        });
        // Static files in production
        if (process.env.NODE_ENV === 'production') {
            const clientPath = path_1.default.join(__dirname, '../../../frontend/build');
            app.use(express_1.default.static(clientPath));
            app.get('*', (req, res) => {
                res.sendFile(path_1.default.join(clientPath, 'index.html'));
            });
        }
        // Error handling
        app.use((err, req, res, next) => {
            common_1.logger.error(`Error processing request ${req.method} ${req.path}`, err);
            res.status(err.status || 500).json({
                success: false,
                message: err.message || 'Internal Server Error',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            });
        });
        app.listen(common_1.config.port, () => {
            common_1.logger.info(`🚀 API Gateway running on port ${common_1.config.port} in ${common_1.config.nodeEnv} mode`);
        });
    }
    catch (error) {
        common_1.logger.error('Failed to bootstrap API Gateway', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map