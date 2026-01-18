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

interface RenameCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  categoryName: string | null;
  newCategoryName: string;
  onNewCategoryNameChange: (name: string) => void;
  itemCount: number;
  isLoading: boolean;
}

export function RenameCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
  categoryName,
  newCategoryName,
  onNewCategoryNameChange,
  itemCount,
  isLoading,
}: RenameCategoryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename Category</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new name for the category{' '}
            <strong className="text-gray-900">"{categoryName}"</strong>.
            <br />
            All {itemCount} item{itemCount !== 1 ? 's' : ''} will be moved to the
            new category.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <Input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="Enter new category name"
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename Category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
