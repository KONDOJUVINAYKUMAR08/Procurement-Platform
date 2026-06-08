import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { connectDatabase } from '@procurement/common';
import { User } from '@procurement/identity-service';
import { Vendor, PurchaseRequest, PurchaseOrder, Contract } from '@procurement/procurement-service';
import { Invoice, Payment } from '@procurement/finance-service';
import { Notification, AuditLog, Document as Doc } from '@procurement/document-service';

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number between min and max
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const clearTable = async (model: any) => {
  try {
    const items = await model.scan().exec();
    const deleteOps = items.map((item: any) => model.delete({ _id: item._id }));
    await Promise.all(deleteOps);
    console.log(`  Cleared ${items.length} items from ${model.name}`);
  } catch (err) {
    // Table may not exist yet — safe to ignore
    console.log(`  Skipping clear for ${model.name} (table may not exist yet)`);
  }
};

const seedData = async () => {
  try {
    await connectDatabase();
    console.log('Connected to DynamoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      clearTable(User),
      clearTable(Vendor),
      clearTable(PurchaseRequest),
      clearTable(PurchaseOrder),
      clearTable(Contract),
      clearTable(Invoice),
      clearTable(Payment),
      clearTable(Notification),
      clearTable(AuditLog),
      clearTable(Doc),
    ]);
    console.log('Cleared existing data.');

    // 1. Create 5 Users (including vendor and auditor roles)
    const salt = await bcrypt.genSalt(12);
    const usersData = [
      {
        _id: uuidv4(),
        email: 'admin@procurement.com',
        password: await bcrypt.hash('admin123', salt),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as any,
        department: 'Administration',
        isActive: true,
      },
      {
        _id: uuidv4(),
        email: 'manager@procurement.com',
        password: await bcrypt.hash('manager123', salt),
        firstName: 'Procurement',
        lastName: 'Manager',
        role: 'procurement_manager' as any,
        department: 'Procurement',
        isActive: true,
      },
      {
        _id: uuidv4(),
        email: 'finance@procurement.com',
        password: await bcrypt.hash('finance123', salt),
        firstName: 'Finance',
        lastName: 'Team',
        role: 'finance' as any,
        department: 'Finance',
        isActive: true,
      },
      {
        _id: uuidv4(),
        email: 'vendor@procurement.com',
        password: await bcrypt.hash('vendor123', salt),
        firstName: 'Vendor',
        lastName: 'Representative',
        role: 'vendor' as any,
        department: 'External',
        isActive: true,
      },
      {
        _id: uuidv4(),
        email: 'auditor@procurement.com',
        password: await bcrypt.hash('auditor123', salt),
        firstName: 'External',
        lastName: 'Auditor',
        role: 'auditor' as any,
        department: 'Compliance',
        isActive: true,
      },
    ];

    const users = [];
    for (const u of usersData) {
      users.push(await User.create(u));
    }
    console.log(`Created ${users.length} users.`);

    // 2. Create 20 Vendors
    const vendorData = [];
    for (let i = 1; i <= 20; i++) {
      vendorData.push({
        _id: uuidv4(),
        vendorName: `Vendor Company ${i}`,
        vendorCode: `VND-${i.toString().padStart(3, '0')}`,
        contactPerson: `Contact Person ${i}`,
        email: `contact${i}@vendor${i}.com`,
        phone: `+1-555-${i.toString().padStart(4, '0')}`,
        address: {
          street: `${i}00 Business Rd`,
          city: randomItem(['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle']),
          state: randomItem(['NY', 'CA', 'IL', 'TX', 'WA']),
          country: 'USA',
          zipCode: `100${i.toString().padStart(2, '0')}`,
        },
        taxId: `TAX-${i.toString().padStart(5, '0')}`,
        bankAccount: `ACC-${i.toString().padStart(8, '0')}`,
        status: randomItem(['active', 'active', 'active', 'pending', 'inactive']),
        rating: randomInt(3, 5),
        notes: `Test vendor ${i}`,
        createdBy: users[0]._id,
        activities: [{ action: 'created', description: 'Vendor created via seed', performedBy: users[0]._id, timestamp: new Date() }],
      });
    }
    const vendors = [];
    for (const v of vendorData) {
      vendors.push(await Vendor.create(v));
    }
    console.log(`Created ${vendors.length} vendors.`);

    // 3. Create 50 Purchase Requests
    const prData = [];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['draft', 'pending', 'approved', 'rejected'];
    for (let i = 1; i <= 50; i++) {
      const itemsCount = randomInt(1, 5);
      const items = Array.from({ length: itemsCount }).map((_, idx) => ({
        name: `Item ${idx + 1} for PR ${i}`,
        description: `Description for item ${idx + 1}`,
        quantity: randomInt(1, 100),
        unitPrice: randomInt(10, 5000),
      }));
      const estimatedCost = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

      prData.push({
        _id: uuidv4(),
        title: `Purchase Request ${i}`,
        department: randomItem(['IT', 'Operations', 'HR', 'Marketing']),
        priority: randomItem(priorities),
        description: `Description for purchase request ${i}`,
        estimatedCost,
        vendor: randomItem(vendors)._id,
        status: randomItem(statuses),
        requestedBy: users[1]._id,
        approvedBy: i % 2 === 0 ? users[0]._id : undefined, // Approve half of them
        items,
      });
    }
    const purchaseRequests = [];
    for (const pr of prData) {
      purchaseRequests.push(await PurchaseRequest.create(pr));
    }
    console.log(`Created ${purchaseRequests.length} purchase requests.`);

    // 4. Create 30 Purchase Orders (mostly from approved PRs)
    const approvedPRs = purchaseRequests.filter(pr => pr.status === 'approved');
    const poData = [];
    const poStatuses = ['draft', 'issued', 'acknowledged', 'shipped', 'completed', 'cancelled'];
    for (let i = 1; i <= 30; i++) {
      const pr = approvedPRs[i % approvedPRs.length]; // reuse PRs if needed
      const items = pr.items.map((item: any) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((acc: number, item: any) => acc + item.totalPrice, 0);
      const tax = subtotal * 0.08;

      poData.push({
        _id: uuidv4(),
        poNumber: `PO-24-${i.toString().padStart(4, '0')}`,
        vendor: pr.vendor,
        purchaseRequest: pr._id,
        items,
        subtotal,
        tax,
        totalAmount: subtotal + tax,
        status: randomItem(poStatuses),
        orderDate: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
        createdBy: users[1]._id,
      });
    }
    const purchaseOrders = [];
    for (const po of poData) {
      purchaseOrders.push(await PurchaseOrder.create(po));
    }
    console.log(`Created ${purchaseOrders.length} purchase orders.`);

    // 5. Create 20 Contracts
    const contractData = [];
    const contractStatuses = ['active', 'expired', 'terminated', 'pending_renewal'];
    for (let i = 1; i <= 20; i++) {
      contractData.push({
        _id: uuidv4(),
        contractName: `Contract Agreement ${i}`,
        vendor: randomItem(vendors)._id,
        contractNumber: `CTR-24-${i.toString().padStart(4, '0')}`,
        effectiveDate: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + randomInt(30, 365) * 24 * 60 * 60 * 1000),
        contractValue: randomInt(10000, 500000),
        status: randomItem(contractStatuses),
        description: `Standard contract ${i}`,
        createdBy: users[0]._id,
      });
    }
    const contracts = [];
    for (const c of contractData) {
      contracts.push(await Contract.create(c));
    }
    console.log(`Created ${contracts.length} contracts.`);

    // 6. Create 40 Invoices (linked to POs)
    const invoiceData = [];
    const invoiceStatuses = ['pending', 'approved', 'paid', 'overdue', 'disputed'];
    for (let i = 1; i <= 40; i++) {
      const po = randomItem(purchaseOrders);
      invoiceData.push({
        _id: uuidv4(),
        invoiceNumber: `INV-24-${i.toString().padStart(4, '0')}`,
        vendor: po.vendor,
        purchaseOrder: po._id,
        amount: po.subtotal,
        tax: po.tax,
        totalAmount: po.totalAmount,
        dueDate: new Date(Date.now() + randomInt(-30, 60) * 24 * 60 * 60 * 1000),
        status: randomItem(invoiceStatuses),
        description: `Invoice for ${po.poNumber}`,
        createdBy: users[2]._id,
        approvedBy: i % 3 !== 0 ? users[0]._id : undefined,
      });
    }
    const invoices = [];
    for (const inv of invoiceData) {
      invoices.push(await Invoice.create(inv));
    }
    console.log(`Created ${invoices.length} invoices.`);

    // 7. Create Payments for Paid Invoices
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const paymentData = [];
    for (let i = 0; i < paidInvoices.length; i++) {
      const inv = paidInvoices[i];
      paymentData.push({
        _id: uuidv4(),
        paymentReference: `PAY-24-${i.toString().padStart(4, '0')}`,
        invoice: inv._id,
        vendor: inv.vendor,
        amount: inv.totalAmount,
        paymentMethod: randomItem(['wire_transfer', 'check', 'ach', 'credit_card']),
        paymentDate: new Date(),
        status: 'completed',
        processedBy: users[2]._id,
      });
    }
    const payments = [];
    for (const pay of paymentData) {
      payments.push(await Payment.create(pay));
    }
    console.log(`Created ${payments.length} payments.`);

    console.log('\n✅ Extensive Seed data created successfully!');
    console.log('\nTest Accounts:');
    console.log('  Admin:      admin@procurement.com / admin123');
    console.log('  Manager:    manager@procurement.com / manager123');
    console.log('  Finance:    finance@procurement.com / finance123');
    console.log('  Vendor:     vendor@procurement.com / vendor123');
    console.log('  Auditor:    auditor@procurement.com / auditor123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
