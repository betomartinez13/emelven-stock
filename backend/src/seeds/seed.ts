import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { User, UserRole } from '../modules/users/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'emelven_db',
  entities: [User],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: 'admin@emelven.com' } });
  if (!existing) {
    const admin = userRepo.create({
      nombre: 'Admin',
      apellido: 'EMELVEN',
      email: 'admin@emelven.com',
      password: 'admin123',
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('Seed complete: admin@emelven.com / admin123');
  } else {
    console.log('Admin user already exists');
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
