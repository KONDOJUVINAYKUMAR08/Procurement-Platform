import { s3, logger } from '@procurement/common';

/**
 * Fetch an S3 object and extract its plain text.
 * PDF is supported via pdf-parse. DOCX and other binary formats are an explicit
 * v1 limitation — they return null so callers can report "unsupported format"
 * rather than feeding garbage to the model.
 */
export const extractTextFromS3 = async (
  bucket: string,
  key: string,
  mimeType: string,
  originalName: string
): Promise<{ text: string | null; reason?: string }> => {
  let buffer: Buffer;
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    buffer = obj.Body as Buffer;
  } catch (err) {
    logger.error('S3 getObject failed for document text extraction: ' + (err as Error).message);
    return { text: null, reason: 'Could not read the file from storage.' };
  }

  const name = (originalName || '').toLowerCase();
  const isPdf = mimeType === 'application/pdf' || name.endsWith('.pdf');
  const isPlain = mimeType?.startsWith('text/') || name.endsWith('.txt');

  if (isPlain) {
    return { text: buffer.toString('utf-8') };
  }

  if (isPdf) {
    try {
      // Lazy require so the dependency only loads when actually needed.
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(buffer);
      const text = (parsed.text || '').trim();
      if (!text) return { text: null, reason: 'The PDF appears to contain no extractable text (it may be a scanned image).' };
      return { text };
    } catch (err) {
      logger.error('pdf-parse failed: ' + (err as Error).message);
      return { text: null, reason: 'Could not extract text from the PDF.' };
    }
  }

  return { text: null, reason: `Unsupported file type for analysis (${mimeType || originalName}). Only PDF and plain text are supported in this version.` };
};
