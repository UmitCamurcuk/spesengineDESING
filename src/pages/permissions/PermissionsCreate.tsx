import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function PermissionsCreate() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni İzin Oluştur</h1>
        <Button variant="outline" onClick={() => navigate('/permissions')}>
          Geri Dön
        </Button>
      </div>
      <p className="text-muted-foreground">Bu sayfa geliştirilme aşamasındadır.</p>
    </div>
  );
}
