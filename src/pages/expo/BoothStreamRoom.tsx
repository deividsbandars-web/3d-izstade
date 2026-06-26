import { Navigate, useParams } from 'react-router-dom';

export default function BoothStreamRoom() {
  const { id } = useParams<{ id: string }>();

  return <Navigate to={id ? `/expo/booth/${id}` : '/expo-3d'} replace />;
}
