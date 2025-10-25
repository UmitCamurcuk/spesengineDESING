import { useParams } from 'react-router-dom';

export function RolesDetails() {
  const { id } = useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rol Detayları</h1>
      <p>ID: {id}</p>
      <p className="text-muted-foreground mt-4">Bu sayfa geliştirilme aşamasındadır.</p>
    </div>
  );
}
