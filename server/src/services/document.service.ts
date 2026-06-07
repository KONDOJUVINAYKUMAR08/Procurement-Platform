import { DocumentModel } from '../models/Document';
import { uploadToS3, deleteFromS3, generatePresignedDownloadUrl } from '../config/aws';

export class DocumentService {
  async upload(
    file: Express.Multer.File,
    category: 'contract' | 'invoice' | 'purchase_order' | 'vendor_certificate',
    relatedId: string | undefined,
    userId: string
  ) {
    const key = `${category}s/${Date.now()}-${file.originalname}`;
    
    const s3Key = await uploadToS3(file.buffer, key, file.mimetype);

    const document = await DocumentModel.create({
      fileName: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      s3Key,
      s3Bucket: process.env.AWS_S3_BUCKET || 'procurement-docs',
      category,
      relatedId,
      uploadedBy: userId,
    });

    return document;
  }

  async findAll(query: { category?: string; relatedId?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.category) filter.category = query.category;
    if (query.relatedId) filter.relatedId = query.relatedId;
    return DocumentModel.find(filter).populate('uploadedBy', 'firstName lastName email');
  }

  async findById(id: string) {
    const doc = await DocumentModel.findById(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  async getDownloadUrl(id: string) {
    const doc = await this.findById(id);
    const url = await generatePresignedDownloadUrl(doc.s3Key);
    return { url, fileName: doc.originalName };
  }

  async delete(id: string) {
    const doc = await DocumentModel.findById(id);
    if (!doc) throw new Error('Document not found');

    await deleteFromS3(doc.s3Key);
    await DocumentModel.findByIdAndDelete(id);

    return { message: 'Document deleted successfully' };
  }
}

export default new DocumentService();
