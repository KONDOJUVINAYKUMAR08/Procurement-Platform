import * as dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogDocument extends Item {
  _id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const auditLogSchema = new dynamoose.Schema(
  {
    _id: {
      type: String,
      hashKey: true,
      default: () => uuidv4(),
    },
    userId: {
      type: String,
      required: true,
      index: {
        name: 'auditUserIdIndex',
        type: 'global',
      },
    },
    action: { type: String, required: true },
    entity: {
      type: String,
      required: true,
      index: {
        name: 'auditEntityIndex',
        type: 'global',
      },
    },
    entityId: { type: String },
    details: { type: Object, default: {} },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = dynamoose.model<AuditLogDocument>('Document_AuditLog', auditLogSchema, {
  create: true,
});
