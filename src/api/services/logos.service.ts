import apiClient from '../client/axios';

type LogoEntity =
  | 'attribute'
  | 'attribute-groups'
  | 'categories'
  | 'families'
  | 'item-types'
  | 'roles';

export const logosService = {
  async upload(entity: LogoEntity, id: string, file: File, comment?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (comment && comment.trim().length > 0) {
      formData.append('comment', comment.trim());
    }
    const { data } = await apiClient.post<{ logoUrl: string }>(`/logos/${entity}/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.logoUrl;
  },
  async remove(entity: LogoEntity, id: string, comment?: string): Promise<void> {
    await apiClient.delete(`/logos/${entity}/${id}/logo`, { data: comment ? { comment } : undefined });
  },
};
