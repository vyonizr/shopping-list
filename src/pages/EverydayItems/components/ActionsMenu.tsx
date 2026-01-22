import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, FileDown, FileSpreadsheet, BookUp, BookDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionsMenuProps {
  onDeleteAll: () => void;
  onDownloadTemplate: () => void;
  onImportCSV: () => void;
  onImportDatabase: () => void;
  onExportDatabase: () => void;
}

export default function ActionsMenu({
  onDeleteAll,
  onDownloadTemplate,
  onImportCSV,
  onImportDatabase,
  onExportDatabase,
}: ActionsMenuProps) {
  const TOOLS = [
    { label: 'CSV Template', icon: FileDown, action: onDownloadTemplate },
    { label: 'Import CSV', icon: FileSpreadsheet, action: onImportCSV },
    { label: 'Export as Code', icon: BookUp, action: onExportDatabase },
    { label: 'Import Code', icon: BookDown, action: onImportDatabase },
    { label: 'Delete All', icon: Trash2, action: onDeleteAll, destructive: true },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Tools</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit bg-white">
        {TOOLS.map(({ label, icon: Icon, action, destructive }) => (
          <DropdownMenuItem
            key={label}
            onClick={action}
            className={cn('hover:bg-gray-100 cursor-pointer',
              destructive ? 'text-red-600 hover:bg-red-100' : '')}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
