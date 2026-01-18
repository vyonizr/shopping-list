import { Search, X } from "lucide-react";
import { Input } from "../ui/input";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <Input
      type="text"
      placeholder="Search items or categories..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
    {searchQuery && (
      <button
        type="button"
        onClick={() => setSearchQuery('')}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

export default SearchBar;