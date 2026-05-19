import { Search } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="w-[340px] bg-base-100 border-r border-base-300 flex flex-col">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-base-300">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="skeleton h-6 w-24" />
        <div className="w-10" />
      </div>

      {/* SEARCH BAR */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <div className="skeleton w-full h-10 rounded-lg" />
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="flex-1 overflow-y-auto py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-4 flex items-center gap-3">
            {/* Avatar skeleton */}
            <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />

            {/* User Info skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-12" />
              </div>
              <div className="skeleton h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
