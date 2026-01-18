import EmptyListIcon from "@/assets/icons/EmptyListIcon";

const EmptyList = () => (
  <section className="text-center py-16 sm:py-20">
    <div className="text-gray-400 mb-4">
      <EmptyListIcon />
    </div>
    <p className="text-lg text-gray-500 mb-2">No items yet</p>
    <p className="text-sm text-gray-400">Add your first item above to get started!</p>
  </section>
);

export default EmptyList;