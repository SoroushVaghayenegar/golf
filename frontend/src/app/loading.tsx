export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-800 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading ...</p>
      </div>
    </div>
  );
} 