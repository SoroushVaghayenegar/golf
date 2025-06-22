import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export default function LottiePlayer({ animationPath }: { animationPath: string }) {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(animationPath);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load animation');
        console.error('Error loading Lottie animation:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnimation();
  }, [animationPath]);

  if (loading) {
    return <div className="flex items-center justify-center">Loading animation...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!animationData) {
    return <div className="flex items-center justify-center">No animation data</div>;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ height: '600px', width: '600px' }}
    />
  );
}