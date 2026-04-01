import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { User } from '../../types/user.types';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';

// ---------- schemas ----------

const createSchema = z.object({
  nombre:   z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role:     z.enum(['admin', 'warehouse', 'manager']),
});

const editSchema = z.object({
  nombre:   z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  role:     z.enum(['admin', 'warehouse', 'manager']),
  isActive: z.boolean(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData   = z.infer<typeof editSchema>;

// ---------- props ----------

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

const selectClass = 'block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

// ---------- component ----------

export default function UserFormModal({ isOpen, onClose, user }: UserFormModalProps) {
  const isEdit = !!user;
  const createUser  = useCreateUser();
  const updateUser  = useUpdateUser();

  // --- create form ---
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'warehouse' },
  });

  // --- edit form ---
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (isEdit && user) {
      editForm.reset({
        nombre:   user.nombre,
        apellido: user.apellido,
        role:     user.role,
        isActive: user.isActive,
      });
    } else {
      createForm.reset({ role: 'warehouse' });
    }
  }, [user, isOpen]);

  const handleClose = () => {
    createForm.reset();
    editForm.reset();
    onClose();
  };

  // --- submit create ---
  const onSubmitCreate = async (data: CreateFormData) => {
    await createUser.mutateAsync(data);
    handleClose();
  };

  // --- submit edit ---
  const onSubmitEdit = async (data: EditFormData) => {
    await updateUser.mutateAsync({ id: user!.id, data });
    handleClose();
  };

  const roleOptions: { value: User['role']; label: string }[] = [
    { value: 'admin',     label: 'Administrador' },
    { value: 'warehouse', label: 'Almacenista' },
    { value: 'manager',   label: 'Gerente' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
    >
      {/* ---- CREATE FORM ---- */}
      {!isEdit && (
        <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              {...createForm.register('nombre')}
              error={createForm.formState.errors.nombre?.message}
            />
            <Input
              label="Apellido"
              {...createForm.register('apellido')}
              error={createForm.formState.errors.apellido?.message}
            />
          </div>

          <Input
            label="Email"
            type="email"
            {...createForm.register('email')}
            error={createForm.formState.errors.email?.message}
            placeholder="usuario@emelven.com"
          />

          <Input
            label="Contraseña"
            type="password"
            {...createForm.register('password')}
            error={createForm.formState.errors.password?.message}
          />

          <div>
            <label className={labelClass}>Rol</label>
            <select {...createForm.register('role')} className={selectClass}>
              {roleOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={createUser.isPending}>
              Crear Usuario
            </Button>
          </div>
        </form>
      )}

      {/* ---- EDIT FORM ---- */}
      {isEdit && (
        <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              {...editForm.register('nombre')}
              error={editForm.formState.errors.nombre?.message}
            />
            <Input
              label="Apellido"
              {...editForm.register('apellido')}
              error={editForm.formState.errors.apellido?.message}
            />
          </div>

          <div>
            <label className={labelClass}>Rol</label>
            <select {...editForm.register('role')} className={selectClass}>
              {roleOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className={labelClass + ' mb-0'}>Estado</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...editForm.register('isActive')}
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              <span className="ml-3 text-sm text-slate-600 dark:text-slate-300">
                {editForm.watch('isActive') ? 'Activo' : 'Inactivo'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={updateUser.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
