import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare } from "lucide-react";

interface SelectAllButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const SelectAllButton = ({ onClick, isLoading }: SelectAllButtonProps) => (
  <Button
    onClick={onClick}
    variant="outline"
    size="sm"
    className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
    disabled={isLoading}
  >
    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
    Select All
  </Button>
)

export default SelectAllButton;