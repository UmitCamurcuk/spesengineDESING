import { useParams } from 'react-router-dom';

export function PermissionsDetails() {
  const { id } = useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">İzin Detayları</h1>
      <p>ID: {id}</p>
      <p className="text-muted-foreground mt-4">Bu sayfa geliştirilme aşamasındadır.</p>
    </div>
  );
}
