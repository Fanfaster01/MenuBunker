export default function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "Error de conexión",
  showRetry = true,
  className = ""
}) {
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.details) return error.details;
    return "Ocurrió un error inesperado";
  };

  const getErrorIcon = (error) => {
    const errorStr = getErrorMessage(error).toLowerCase();
    
    if (errorStr.includes('conexión') || errorStr.includes('network') || errorStr.includes('timeout')) {
      return "🌐";
    }
    if (errorStr.includes('base de datos') || errorStr.includes('database')) {
      return "🗄️";
    }
    if (errorStr.includes('autenticación') || errorStr.includes('authentication') || errorStr.includes('login')) {
      return "🔐";
    }
    if (errorStr.includes('servidor') || errorStr.includes('server')) {
      return "🖥️";
    }
    return "⚠️";
  };

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">
          {getErrorIcon(error)}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {title}
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">
            {getErrorMessage(error)}
          </p>
        </div>

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            🔄 Intentar de nuevo
          </button>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Si el problema persiste, verifica tu conexión a internet
        </div>
      </div>
    </div>
  );
}