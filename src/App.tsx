import { useRouter } from './hooks/useRouter';
import VectorMath from './VectorMath';

export default function App() {
  const { currentPath } = useRouter();

  return (
    <div className="min-h-screen bg-transparent">
      <VectorMath alchemyActive={currentPath === '/lab'} />
    </div>
  );
}
