import api from '../api/axios';
import toast from 'react-hot-toast';

export async function downloadPdf(url: string, filename: string): Promise<void> {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    toast.error('Error al exportar PDF');
  }
}
