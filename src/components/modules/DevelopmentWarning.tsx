import { AlertTriangle } from 'lucide-react';

export default function DevelopmentWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 relative">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 mb-1">
            Development Notice
          </h3>
          <p className="text-sm text-amber-800">
            Please back up your list regularly using the Export feature on Tools
            menu.
          </p>
        </div>
      </div>
    </div>
  );
}
