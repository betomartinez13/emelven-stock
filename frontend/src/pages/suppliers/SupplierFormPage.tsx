import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageFormHeader from '../../components/shared/PageFormHeader';
import { useSupplier, useCreateSupplier, useUpdateSupplier } from '../../hooks/useSuppliers';

const schema = z.object({
  nombre:    z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  contacto:  z.string().max(100, 'Máximo 100 caracteres').optional(),
  telefono:  z.string().max(20, 'Máximo 20 caracteres').optional(),
  email:     z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().max(200, 'Máximo 200 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

export default function SupplierFormPage() {
  const navigate    = useNavigate();
  const { id }      = useParams<{ id: string }>();
  const isEdit      = !!id;
  const supplierId  = id ? Number(id) : 0;

  const { data: supplier, isLoading } = useSupplier(supplierId);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isEdit && supplier) {
      reset({
        nombre:    supplier.nombre,
        contacto:  supplier.contacto  ?? '',
        telefono:  supplier.telefono  ?? '',
        email:     supplier.email     ?? '',
        direccion: supplier.direccion ?? '',
      });
    }
  }, [supplier, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    // Send empty strings as undefined so backend ignores them
    const payload = {
      nombre:    data.nombre,
      contacto:  data.contacto  || undefined,
      telefono:  data.telefono  || undefined,
      email:     data.email     || undefined,
      direccion: data.direccion || undefined,
    };

    if (isEdit) {
      await updateSupplier.mutateAsync({ id: supplierId, data: payload });
    } else {
      await createSupplier.mutateAsync(payload);
    }
    navigate('/suppliers');
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageFormHeader
        title={isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        subtitle={isEdit ? 'Modifica los datos del proveedor' : 'Registra un nuevo proveedor'}
        onBack={() => navigate('/suppliers')}
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Nombre *"
            {...register('nombre')}
            error={errors.nombre?.message}
            placeholder="Ej: Distribuidora El Sol"
            maxLength={150}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Persona de contacto"
              {...register('contacto')}
              error={errors.contacto?.message}
              placeholder="Nombre del contacto"
              maxLength={100}
            />
            <Input
              label="Teléfono"
              {...register('telefono')}
              error={errors.telefono?.message}
              placeholder="Ej: 0414-1234567"
              maxLength={20}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="contacto@proveedor.com"
          />

          <Input
            label="Dirección"
            {...register('direccion')}
            error={errors.direccion?.message}
            placeholder="Dirección del proveedor"
            maxLength={200}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => navigate('/suppliers')}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Guardar Cambios' : 'Crear Proveedor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
