import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { PurchaseRequest } from '../models/PurchaseRequest';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Contract } from '../models/Contract';
import { Invoice } from '../models/Invoice';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Vendor.deleteMany({}),
      PurchaseRequest.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      Contract.deleteMany({}),
      Invoice.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // Create users
    const salt = await bcrypt.genSalt(12);
    const users = await User.create([
      {
        email: 'admin@procurement.com',
        password: await bcrypt.hash('admin123', salt),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'Administration',
        isActive: true,
      },
      {
        email: 'manager@procurement.com',
        password: await bcrypt.hash('manager123', salt),
        firstName: 'Procurement',
        lastName: 'Manager',
        role: 'procurement_manager',
        department: 'Procurement',
        isActive: true,
      },
      {
        email: 'finance@procurement.com',
        password: await bcrypt.hash('finance123', salt),
        firstName: 'Finance',
        lastName: 'Team',
        role: 'finance',
        department: 'Finance',
        isActive: true,
      },
    ]);

    console.log(`Created ${users.length} users`);

    // Create vendors
    const vendors = await Vendor.create([
      {
        vendorName: 'TechSupply Inc.',
        vendorCode: 'VND-001',
        contactPerson: 'John Smith',
        email: 'john@techsupply.com',
        phone: '+1-555-0101',
        address: { street: '123 Tech Ave', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94102' },
        taxId: 'TAX-001',
        bankAccount: 'ENC-ACC-001',
        status: 'active',
        rating: 4.5,
        notes: 'Primary technology vendor',
        createdBy: users[0]._id,
        activities: [{ action: 'created', description: 'Vendor created', performedBy: users[0]._id }],
      },
      {
        vendorName: 'OfficeMax Solutions',
        vendorCode: 'VND-002',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@officemax.com',
        phone: '+1-555-0102',
        address: { street: '456 Office Blvd', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
        taxId: 'TAX-002',
        bankAccount: 'ENC-ACC-002',
        status: 'active',
        rating: 4.0,
        notes: 'Office supplies vendor',
        createdBy: users[1]._id,
        activities: [{ action: 'created', description: 'Vendor created', performedBy: users[1]._id }],
      },
      {
        vendorName: 'CloudNet Services',
        vendorCode: 'VND-003',
        contactPerson: 'Mike Davis',
        email: 'mike@cloudnet.com',
        phone: '+1-555-0103',
        address: { street: '789 Cloud St', city: 'Austin', state: 'TX', country: 'USA', zipCode: '73301' },
        taxId: 'TAX-003',
        bankAccount: 'ENC-ACC-003',
        status: 'pending',
        rating: 3.5,
        notes: 'Cloud infrastructure provider',
        createdBy: users[1]._id,
        activities: [{ action: 'created', description: 'Vendor created', performedBy: users[1]._id }],
      },
      {
        vendorName: 'SecureIT Corp',
        vendorCode: 'VND-004',
        contactPerson: 'Emily Brown',
        email: 'emily@secureit.com',
        phone: '+1-555-0104',
        address: { street: '321 Security Lane', city: 'Seattle', state: 'WA', country: 'USA', zipCode: '98101' },
        taxId: 'TAX-004',
        bankAccount: 'ENC-ACC-004',
        status: 'active',
        rating: 4.8,
        notes: 'Cybersecurity solutions',
        createdBy: users[0]._id,
        activities: [{ action: 'created', description: 'Vendor created', performedBy: users[0]._id }],
      },
      {
        vendorName: 'GreenEnergy Ltd.',
        vendorCode: 'VND-005',
        contactPerson: 'David Wilson',
        email: 'david@greenenergy.com',
        phone: '+1-555-0105',
        address: { street: '654 Green Rd', city: 'Portland', state: 'OR', country: 'USA', zipCode: '97201' },
        taxId: 'TAX-005',
        bankAccount: 'ENC-ACC-005',
        status: 'inactive',
        rating: 3.0,
        notes: 'Energy solutions provider',
        createdBy: users[1]._id,
        activities: [{ action: 'created', description: 'Vendor created', performedBy: users[1]._id }],
      },
    ]);

    console.log(`Created ${vendors.length} vendors`);

    // Create purchase requests
    const purchaseRequests = await PurchaseRequest.create([
      {
        title: 'New Laptop Procurement',
        department: 'IT',
        priority: 'high',
        description: 'Need 20 new laptops for the engineering team',
        estimatedCost: 40000,
        vendor: vendors[0]._id,
        status: 'approved',
        requestedBy: users[1]._id,
        approvedBy: users[0]._id,
        items: [
          { name: 'MacBook Pro 16"', description: 'M3 Pro, 18GB RAM', quantity: 20, unitPrice: 2000 },
        ],
      },
      {
        title: 'Office Supplies Q1',
        department: 'Operations',
        priority: 'medium',
        description: 'Quarterly office supplies order',
        estimatedCost: 5000,
        vendor: vendors[1]._id,
        status: 'pending',
        requestedBy: users[1]._id,
        items: [
          { name: 'Printer Paper', description: 'A4, 500 sheets per ream', quantity: 100, unitPrice: 8 },
          { name: 'Ink Cartridges', description: 'HP 952XL', quantity: 20, unitPrice: 35 },
        ],
      },
      {
        title: 'Cloud Migration Services',
        department: 'IT',
        priority: 'urgent',
        description: 'Migration of on-premise servers to AWS',
        estimatedCost: 150000,
        vendor: vendors[2]._id,
        status: 'pending',
        requestedBy: users[1]._id,
        items: [
          { name: 'AWS Migration', description: 'Full infrastructure migration', quantity: 1, unitPrice: 150000 },
        ],
      },
      {
        title: 'Security Audit',
        department: 'IT',
        priority: 'high',
        description: 'Annual security audit and penetration testing',
        estimatedCost: 25000,
        vendor: vendors[3]._id,
        status: 'approved',
        requestedBy: users[1]._id,
        approvedBy: users[0]._id,
        items: [
          { name: 'Pen Testing', description: 'Comprehensive security assessment', quantity: 1, unitPrice: 25000 },
        ],
      },
      {
        title: 'Office Furniture',
        department: 'Operations',
        priority: 'low',
        description: 'Standing desks for new hires',
        estimatedCost: 12000,
        vendor: vendors[1]._id,
        status: 'draft',
        requestedBy: users[1]._id,
        items: [
          { name: 'Standing Desk', description: 'Electric, 60" wide', quantity: 10, unitPrice: 1200 },
        ],
      },
    ]);

    console.log(`Created ${purchaseRequests.length} purchase requests`);

    // Create purchase orders
    const purchaseOrders = await PurchaseOrder.create([
      {
        poNumber: 'PO-2401-0001',
        vendor: vendors[0]._id,
        purchaseRequest: purchaseRequests[0]._id,
        items: [{ name: 'MacBook Pro 16"', description: 'M3 Pro, 18GB RAM', quantity: 20, unitPrice: 2000, totalPrice: 40000 }],
        subtotal: 40000,
        tax: 3200,
        totalAmount: 43200,
        status: 'completed',
        orderDate: new Date('2024-01-15'),
        createdBy: users[1]._id,
      },
      {
        poNumber: 'PO-2402-0002',
        vendor: vendors[3]._id,
        purchaseRequest: purchaseRequests[3]._id,
        items: [{ name: 'Pen Testing', description: 'Comprehensive security assessment', quantity: 1, unitPrice: 25000, totalPrice: 25000 }],
        subtotal: 25000,
        tax: 2000,
        totalAmount: 27000,
        status: 'issued',
        orderDate: new Date('2024-02-01'),
        createdBy: users[1]._id,
      },
      {
        poNumber: 'PO-2403-0003',
        vendor: vendors[1]._id,
        items: [
          { name: 'Printer Paper', description: 'A4, 500 sheets', quantity: 100, unitPrice: 8, totalPrice: 800 },
          { name: 'Ink Cartridges', description: 'HP 952XL', quantity: 20, unitPrice: 35, totalPrice: 700 },
        ],
        subtotal: 1500,
        tax: 120,
        totalAmount: 1620,
        status: 'issued',
        orderDate: new Date('2024-03-01'),
        createdBy: users[1]._id,
      },
    ]);

    console.log(`Created ${purchaseOrders.length} purchase orders`);

    // Create contracts
    const contracts = await Contract.create([
      {
        contractName: 'TechSupply Master Agreement',
        vendor: vendors[0]._id,
        contractNumber: 'CTR-24-0001',
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-12-31'),
        contractValue: 500000,
        status: 'active',
        description: 'Master supply agreement for technology equipment',
        createdBy: users[0]._id,
      },
      {
        contractName: 'OfficeMax Supply Contract',
        vendor: vendors[1]._id,
        contractNumber: 'CTR-24-0002',
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        contractValue: 100000,
        status: 'active',
        description: 'Annual office supplies contract',
        createdBy: users[1]._id,
      },
      {
        contractName: 'SecureIT Audit Agreement',
        vendor: vendors[3]._id,
        contractNumber: 'CTR-24-0003',
        effectiveDate: new Date('2024-03-01'),
        expiryDate: new Date('2024-06-30'),
        contractValue: 75000,
        status: 'active',
        description: 'Security audit and consulting agreement',
        createdBy: users[0]._id,
      },
    ]);

    console.log(`Created ${contracts.length} contracts`);

    // Create invoices
    const invoices = await Invoice.create([
      {
        invoiceNumber: 'INV-2401-0001',
        vendor: vendors[0]._id,
        purchaseOrder: purchaseOrders[0]._id,
        amount: 40000,
        tax: 3200,
        totalAmount: 43200,
        dueDate: new Date('2024-02-15'),
        status: 'paid',
        description: 'Laptops delivery invoice',
        paymentDate: new Date('2024-02-10'),
        paymentMethod: 'Wire Transfer',
        approvedBy: users[0]._id,
        createdBy: users[2]._id,
      },
      {
        invoiceNumber: 'INV-2402-0002',
        vendor: vendors[3]._id,
        purchaseOrder: purchaseOrders[1]._id,
        amount: 25000,
        tax: 2000,
        totalAmount: 27000,
        dueDate: new Date('2024-03-15'),
        status: 'approved',
        description: 'Security audit invoice',
        approvedBy: users[0]._id,
        createdBy: users[2]._id,
      },
      {
        invoiceNumber: 'INV-2403-0003',
        vendor: vendors[1]._id,
        purchaseOrder: purchaseOrders[2]._id,
        amount: 1500,
        tax: 120,
        totalAmount: 1620,
        dueDate: new Date('2024-04-01'),
        status: 'pending',
        description: 'Office supplies invoice',
        createdBy: users[2]._id,
      },
      {
        invoiceNumber: 'INV-2404-0004',
        vendor: vendors[1]._id,
        contract: contracts[1]._id,
        amount: 50000,
        tax: 4000,
        totalAmount: 54000,
        dueDate: new Date('2024-06-30'),
        status: 'pending',
        description: 'Q2 Office supplies billing',
        createdBy: users[2]._id,
      },
    ]);

    console.log(`Created ${invoices.length} invoices`);

    // Create notifications
    await Notification.create([
      {
        title: 'Contract Expiring Soon',
        message: 'OfficeMax Supply Contract expires in 30 days',
        type: 'contract_expiry',
        isRead: false,
        relatedId: contracts[1]._id,
        relatedModel: 'Contract',
      },
      {
        title: 'Invoice Due',
        message: 'Invoice INV-2403-0003 is due on April 1st',
        type: 'invoice_due',
        isRead: false,
        relatedId: invoices[2]._id,
        relatedModel: 'Invoice',
      },
      {
        title: 'New Vendor Pending Approval',
        message: 'CloudNet Services requires approval',
        type: 'vendor_approval',
        isRead: false,
        relatedId: vendors[2]._id,
        relatedModel: 'Vendor',
      },
      {
        title: 'Purchase Request Approved',
        message: 'Security Audit request has been approved',
        type: 'purchase_approval',
        isRead: true,
        relatedId: purchaseRequests[3]._id,
        relatedModel: 'PurchaseRequest',
      },
    ]);

    console.log('Created notifications');

    // Create audit logs
    await AuditLog.create([
      { userId: users[0]._id, action: 'login', entity: 'auth', details: { method: 'email' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      { userId: users[0]._id, action: 'create', entity: 'vendor', entityId: vendors[0]._id, details: { vendorName: 'TechSupply Inc.' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      { userId: users[1]._id, action: 'create', entity: 'purchase_request', entityId: purchaseRequests[0]._id, details: { title: 'New Laptop Procurement' }, ipAddress: '192.168.1.2', userAgent: 'Firefox/121' },
      { userId: users[0]._id, action: 'approve', entity: 'purchase_request', entityId: purchaseRequests[0]._id, details: { title: 'New Laptop Procurement' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      { userId: users[1]._id, action: 'create', entity: 'purchase_order', entityId: purchaseOrders[0]._id, details: { poNumber: 'PO-2401-0001' }, ipAddress: '192.168.1.2', userAgent: 'Firefox/121' },
      { userId: users[2]._id, action: 'create', entity: 'invoice', entityId: invoices[0]._id, details: { invoiceNumber: 'INV-2401-0001' }, ipAddress: '192.168.1.3', userAgent: 'Safari/17' },
      { userId: users[0]._id, action: 'approve', entity: 'invoice', entityId: invoices[0]._id, details: { invoiceNumber: 'INV-2401-0001' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      { userId: users[1]._id, action: 'update', entity: 'vendor', entityId: vendors[0]._id, details: { updatedFields: ['rating'] }, ipAddress: '192.168.1.2', userAgent: 'Firefox/121' },
      { userId: users[0]._id, action: 'create', entity: 'contract', entityId: contracts[0]._id, details: { contractName: 'TechSupply Master Agreement' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      { userId: users[0]._id, action: 'login', entity: 'auth', details: { method: 'email' }, ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
    ]);

    console.log('Created audit logs');
    console.log('\n✅ Seed data created successfully!');
    console.log('\nTest Accounts:');
    console.log('  Admin:      admin@procurement.com / admin123');
    console.log('  Manager:    manager@procurement.com / manager123');
    console.log('  Finance:    finance@procurement.com / finance123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
