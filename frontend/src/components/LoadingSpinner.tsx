export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-blue ${cls}`} />
    </div>
  )
}
