export interface ReceiptPdfInput {
  receiptNumber: string;
  primaryColor?: string | null;
  footerText?: string | null;
  generatedDate?: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  invoiceRef?: string;
  items?: Array<{ description: string; amount: number }>;
}

export interface InvoicePdfInput {
  invoiceNumber: string;
  primaryColor?: string | null;
  footerText?: string | null;
  generatedDate?: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  discountAmount: number;
  discountReason?: string | null;
  currency: string;
  status: string;
  issuedAt?: string;
  dueDate?: string;
  items: Array<{ name: string; category: string; amount: number; isOptional: boolean }>;
}

export interface CertificatePdfInput {
  certificateNumber: string;
  memberName: string;
  programmeName: string;
  programmeNickname?: string | null;
  cohortName?: string | null;
  completionDate: string;
  primaryColor?: string | null;
  footerText?: string | null;
  generatedDate?: string | null;
  verificationUrl?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
}

export const DOCUMENT_SERVICE_TOKEN = Symbol('DOCUMENT_SERVICE_TOKEN');

export abstract class DocumentServicePort {
  abstract generateReceiptPdf(input: ReceiptPdfInput): Promise<Buffer>;
  abstract generateInvoicePdf(input: InvoicePdfInput): Promise<Buffer>;
  abstract generateCertificatePdf(input: CertificatePdfInput): Promise<Buffer>;
}
