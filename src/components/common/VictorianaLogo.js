export default function VictorianaLogo({ className = "", width = "300", height = "120" }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      {/* Placeholder para el logo de La Victoriana */}
      <div className="text-center">
        <div className="text-6xl mb-2">🏪</div>
        <h1 className="text-2xl font-bold text-gray-800">LA VICTORIANA</h1>
        <p className="text-sm text-gray-600">BODEGÓN</p>
      </div>
    </div>
  );
}