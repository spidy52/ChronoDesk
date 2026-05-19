import { useSearchStore } from '../../store/useSearchStore';

const SearchContainer = () => {
  const { searchLoading, searchResult, createChatWithUser } = useSearchStore();

  const foundUsers = searchResult?.users ?? [];
  const notFound = searchResult?.notFound;

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {searchLoading && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          Searching…
        </div>
      )}

      {!searchLoading && notFound && foundUsers.length === 0 && (
        <div className="p-4 text-center text-red-500 text-sm">
          No users found
        </div>
      )}

      {!searchLoading && foundUsers.length > 0 && (
        <div className="space-y-2">
          {foundUsers.map((user) => (
            <button
              key={user._id}
              onClick={() =>
                createChatWithUser(user.username || user.name || '')
              }
              className="w-full p-4 flex items-center gap-3 rounded-2xl hover:bg-secondary transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col text-left flex-1 min-w-0">
                <h3 className="font-semibold truncate text-sm">
                  {user.name || user.username}
                </h3>
                {user.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!searchLoading && !searchResult && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          Search for users by username
        </div>
      )}
    </div>
  );
};

export default SearchContainer;
