import { Button } from '@/components/ui/button';
import {
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';

interface PageHeaderProps {
  onDeleteAll: () => void;
  onDownloadTemplate: () => void;
  onImportCSV: () => void;
  onImportDatabase: () => void;
  onExportDatabase: () => void;
}

export default function PageHeader({
  onDeleteAll,
  onDownloadTemplate,
  onImportCSV,
  onImportDatabase,
  onExportDatabase,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
        Everyday Items
      </h1>

      <nav className="flex gap-2 flex-wrap">
        <Button
          onClick={onDeleteAll}
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete All
        </Button>
        <Button
          onClick={onDownloadTemplate}
          variant="outline"
          className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
        >
          <FileDown className="mr-2 h-4 w-4" />
          CSV Template
        </Button>
        <Button
          onClick={onImportCSV}
          variant="outline"
          className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
        <Button
          onClick={onImportDatabase}
          variant="outline"
          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
        >
          <Download className="mr-2 h-4 w-4" />
          Restore
        </Button>
        <Button
          onClick={onExportDatabase}
          variant="outline"
          className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
        >
          <Upload className="mr-2 h-4 w-4" />
          Backup
        </Button>
      </nav>
    </header>
  );
}
