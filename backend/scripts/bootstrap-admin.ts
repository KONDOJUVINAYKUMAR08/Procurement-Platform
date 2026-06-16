import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { connectDatabase } from '@procurement/common';

const bootstrapAdmin = async () => {
  try {
    console.log('Initializing database connection...');
    await connectDatabase();
    console.log('Database connected successfully.');

    // Dynamically import models after connection is active
    console.log('Importing User model...');
    const { User } = await import('@procurement/identity-service');

    const adminEmail = 'admin@procurement.com';
    console.log(`Checking if admin user already exists: ${adminEmail}...`);
    const existingUsers = await User.scan('email').eq(adminEmail).exec();

    if (existingUsers && existingUsers.length > 0) {
      console.log(`[BOOTSTRAP] Admin user '${adminEmail}' already exists. No action required.`);
    } else {
      console.log(`[BOOTSTRAP] Admin user '${adminEmail}' not found. Bootstrapping account...`);
      
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        _id: uuidv4(),
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as any,
        department: 'Administration',
        isActive: true,
        mustChangePassword: false,
      });

      console.log(`[BOOTSTRAP SUCCESS] Safely bootstrapped admin user '${adminEmail}' with default password 'admin123'.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('[BOOTSTRAP ERROR] Failed to bootstrap admin user:', error);
    process.exit(1);
  }
};

bootstrapAdmin();
