import ActionsMenu from './ActionsMenu';

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
    <header className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Everyday Items
        </h1>
        <ActionsMenu
          onDeleteAll={onDeleteAll}
          onDownloadTemplate={onDownloadTemplate}
          onImportCSV={onImportCSV}
          onImportDatabase={onImportDatabase}
          onExportDatabase={onExportDatabase}
        />
      </div>
    </header>
  );
}
