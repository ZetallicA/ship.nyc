import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, showBack = false, backHref = '/dashboard', action }: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && (
              <Link to={backHref} className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
    </header>
  )
}
