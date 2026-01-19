import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, Upload, Download } from 'lucide-react';

interface ActionsMenuProps {
  onDeleteAll: () => void;
  onDownloadTemplate: () => void;
  onImportCSV: () => void;
  onImportDatabase: () => void;
  onExportDatabase: () => void;
}

export default function ActionsMenu({
  onDeleteAll,
  onImportDatabase,
  onExportDatabase,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Tools</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit bg-white">
        {/* <DropdownMenuItem onClick={onDownloadTemplate}>
          <FileDown className="mr-2 h-4 w-4 text-purple-600" />
          <span>CSV Template</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-orange-600" />
          <span>Import CSV</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem onClick={onExportDatabase}>
          <Upload className="mr-2 h-4 w-4" />
          <span>Backup</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImportDatabase}>
          <Download className="mr-2 h-4 w-4" />
          <span>Restore</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDeleteAll}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete All</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
