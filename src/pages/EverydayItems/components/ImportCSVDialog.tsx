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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ImportCSVDialog({
  open,
  onOpenChange,
  csvFile,
  onFileChange,
  onConfirm,
  onCancel,
  isLoading,
}: ImportCSVDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Import Items from CSV</AlertDialogTitle>
          <AlertDialogDescription>
            Select a CSV file to import. The file must have "item_name" and
            "category" columns.
            <br />
            <br />
            <strong className="text-gray-900">Note:</strong> Items will be added
            to your existing list. Duplicates will be skipped.
            <br />
            <br />
            Download the CSV template if you need a starting point.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="cursor-pointer"
            />
            {csvFile && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                <strong>Selected file:</strong> {csvFile.name} (
                {(csvFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isLoading || !csvFile}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Items
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
