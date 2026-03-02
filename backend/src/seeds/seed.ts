import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'emelven_db',
  entities: [User, Category],
  synchronize: true,
});

const defaultCategories = [
  { nombre: 'Conductores',        descripcion: 'Cables y alambres de cobre y aluminio' },
  { nombre: 'Acero',              descripcion: 'Chapas, láminas y núcleos de acero' },
  { nombre: 'Aislamiento',        descripcion: 'Papel kraft, cintas y materiales aislantes' },
  { nombre: 'Aceite',             descripcion: 'Aceite dieléctrico para transformadores' },
  { nombre: 'Herrajes',           descripcion: 'Tornillería, abrazaderas y piezas metálicas' },
  { nombre: 'Pintura',            descripcion: 'Pinturas y recubrimientos anticorrosión' },
  { nombre: 'Ferretería',         descripcion: 'Materiales generales de ferretería' },
  { nombre: 'Producto Terminado', descripcion: 'Transformadores ensamblados' },
];

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);

  // Seed admin user
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

  // Seed default categories
  for (const cat of defaultCategories) {
    const existing = await categoryRepo.findOne({ where: { nombre: cat.nombre } });
    if (!existing) {
      await categoryRepo.save(categoryRepo.create(cat));
      console.log(`Category created: ${cat.nombre}`);
    }
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
