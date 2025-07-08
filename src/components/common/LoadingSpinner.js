export default function LoadingSpinner({ 
  message = "Cargando...", 
  size = "large",
  className = ""
}) {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12",
    xlarge: "h-16 w-16"
  };

  const containerClasses = {
    small: "py-4",
    medium: "py-6",
    large: "py-12",
    xlarge: "py-16"
  };

  return (
    <div className={`flex flex-col justify-center items-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]} mb-3`}></div>
      <p className="text-gray-600 text-sm font-medium">{message}</p>
    </div>
  );
}