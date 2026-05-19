const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {skeletonMessages.map((_, idx) => (
        <div
          key={idx}
          className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <div className="max-w-[70%]">
            <div className="skeleton h-16 w-[250px] rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
