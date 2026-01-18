import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportedData: string;
  onCopy: () => void;
  onClose: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportedData,
  onCopy,
  onClose,
}: ExportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Backup Your Items</AlertDialogTitle>
          <AlertDialogDescription>
            Copy the text below to save all your items. You can restore this
            backup later on any device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <textarea
            value={exportedData}
            readOnly
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
            onClick={(e) => e.currentTarget.select()}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <AlertDialogAction
            onClick={onCopy}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Copy to Clipboard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importData: string;
  onImportDataChange: (data: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ImportDialog({
  open,
  onOpenChange,
  importData,
  onImportDataChange,
  onConfirm,
  onCancel,
  isLoading,
}: ImportDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Restore Your Items</AlertDialogTitle>
          <AlertDialogDescription>
            Paste your backup text below.{' '}
            <strong className="text-red-600">Warning:</strong> This will replace
            all current items with the backup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <textarea
            value={importData}
            onChange={(e) => onImportDataChange(e.target.value)}
            placeholder="Paste your backup code here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore Items
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
