import { Button } from "@/components/ui/button";
import { Loader2, Square } from "lucide-react";

interface ClearAllButtonProps {
  handleClearAll: () => void;
  isBulkOperationLoading: boolean;
}

const ClearAllButton = ({ handleClearAll, isBulkOperationLoading }: ClearAllButtonProps) => (
  <Button
    onClick={handleClearAll}
    variant="outline"
    size="sm"
    className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
    disabled={isBulkOperationLoading}
  >
    {isBulkOperationLoading ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Square className="mr-2 h-4 w-4" />
    )}
    Clear All
  </Button>
);

export default ClearAllButton;