import { Invoice, InvoiceDocument } from '../models/Invoice';
import { generateInvoiceNumber } from '@procurement/utils';
import { v4 as uuidv4 } from 'uuid';

export class InvoiceService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    let scanReq = Invoice.scan();

    if (query.status) {
      scanReq = scanReq.where('status').eq(query.status);
    }
    if (query.vendor) {
      scanReq = scanReq.where('vendor').eq(query.vendor);
    }

    const allInvoices = await scanReq.exec();

    let filtered = [...allInvoices];
    if (query.search) {
      const search = query.search.toLowerCase();
      filtered = filtered.filter((i: any) => 
        (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(search))
      );
    }

    filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const invoices = filtered.slice(skip, skip + limit);
    const total = filtered.length;

    return { invoices, total };
  }

  async findById(id: string) {
    const invoice = await Invoice.get(id);

    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async create(data: Partial<InvoiceDocument>, userId: string) {
    const invoiceNumber = generateInvoiceNumber();
    
    if (data.amount) {
      data.totalAmount = data.amount + (data.tax || 0);
    }

    const invoice = await Invoice.create({
      ...data,
      _id: uuidv4(),
      invoiceNumber,
      createdBy: userId,
    });

    return invoice;
  }

  async update(id: string, data: Partial<InvoiceDocument>) {
    const invoice = await Invoice.get(id);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'paid' || invoice.status === 'approved') {
      throw new Error(`Cannot update invoice in ${invoice.status} status`);
    }

    if (data.amount !== undefined || data.tax !== undefined) {
      const amount = data.amount !== undefined ? data.amount : invoice.amount;
      const tax = data.tax !== undefined ? data.tax : invoice.tax;
      data.totalAmount = amount + tax;
    }

    const updated = await Invoice.update({ _id: id }, data);
    return updated;
  }

  async approve(id: string, userId: string) {
    const invoice = await Invoice.get(id);
    if (!invoice) throw new Error('Invoice not found');
    
    if (invoice.status !== 'pending') {
      throw new Error('Only pending invoices can be approved');
    }

    const updated = await Invoice.update({ _id: id }, { status: 'approved', approvedBy: userId });
    return updated;
  }

  async markAsPaid(id: string, paymentMethod: string) {
    const invoice = await Invoice.get(id);
    if (!invoice) throw new Error('Invoice not found');
    
    if (invoice.status !== 'approved') {
      throw new Error('Invoice must be approved before payment');
    }

    const updated = await Invoice.update({ _id: id }, {
      status: 'paid',
      paymentDate: new Date(),
      paymentMethod,
    });
    return updated;
  }

  async getStats() {
    const allInvoices = await Invoice.scan().exec();
    
    const statusMap: Record<string, { count: number; totalValue: number }> = {};
    
    allInvoices.forEach((i: any) => {
      const status = i.status || 'unknown';
      if (!statusMap[status]) {
        statusMap[status] = { count: 0, totalValue: 0 };
      }
      statusMap[status].count += 1;
      statusMap[status].totalValue += (i.totalAmount || 0);
    });

    const stats = Object.keys(statusMap).map(status => ({
      _id: status,
      count: statusMap[status].count,
      totalValue: statusMap[status].totalValue,
    }));

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);

    return {
      total,
      byStatus: stats,
    };
  }
}

export default new InvoiceService();
