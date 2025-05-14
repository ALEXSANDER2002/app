export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
        <p className="text-slate-600">Carregando...</p>
      </div>
    </div>
  )
}
