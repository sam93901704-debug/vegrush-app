export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-52 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"></div>

      {/* Content Skeleton */}
      <div className="p-5">
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded-lg mb-2 w-3/4"></div>
        
        {/* Description */}
        <div className="h-4 bg-gray-100 rounded mb-1 w-full"></div>
        <div className="h-4 bg-gray-100 rounded mb-4 w-2/3"></div>
        
        {/* Price and Stock */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-7 bg-gray-200 rounded-lg mb-1 w-24"></div>
            <div className="h-3 bg-gray-100 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-100 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  );
}

