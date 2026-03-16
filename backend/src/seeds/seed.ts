import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Material } from '../modules/materials/entities/material.entity';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'emelven_db',
  entities: [User, Category, Supplier, Material],
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

const sampleMaterials = [
  { nombre: 'Cable de cobre #12',  unidad: 'm',      stockActual: 500,  stockMin: 100, stockMax: 1000, categoryName: 'Conductores' },
  { nombre: 'Chapa de acero CRNO', unidad: 'kg',     stockActual: 200,  stockMin: 50,  stockMax: 500,  categoryName: 'Acero' },
  { nombre: 'Papel kraft 60g',     unidad: 'rollo',  stockActual: 30,   stockMin: 10,  stockMax: 100,  categoryName: 'Aislamiento' },
  { nombre: 'Aceite dieléctrico',  unidad: 'litro',  stockActual: 800,  stockMin: 200, stockMax: 2000, categoryName: 'Aceite' },
  { nombre: 'Tornillos M10',       unidad: 'unidad', stockActual: 1000, stockMin: 200, stockMax: 5000, categoryName: 'Herrajes' },
];

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const materialRepo = AppDataSource.getRepository(Material);

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
    const existingCat = await categoryRepo.findOne({ where: { nombre: cat.nombre } });
    if (!existingCat) {
      await categoryRepo.save(categoryRepo.create(cat));
      console.log(`Category created: ${cat.nombre}`);
    }
  }

  // Seed sample materials
  for (const mat of sampleMaterials) {
    const existingMat = await materialRepo.findOne({ where: { nombre: mat.nombre } });
    if (!existingMat) {
      const category = await categoryRepo.findOne({ where: { nombre: mat.categoryName } });
      if (category) {
        const { categoryName: _, ...matData } = mat;
        await materialRepo.save(materialRepo.create({ ...matData, categoryId: category.id }));
        console.log(`Material created: ${mat.nombre}`);
      }
    }
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
