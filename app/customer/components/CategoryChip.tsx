'use client';

interface CategoryChipProps {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

export default function CategoryChip({
  label,
  icon,
  isSelected,
  onClick,
}: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 px-6 py-4 rounded-2xl
        transition-all duration-300 ease-out
        whitespace-nowrap
        ${
          isSelected
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105'
            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
        }
      `}
      style={{
        minWidth: '100px',
      }}
    >
      <div
        className={`
          text-2xl transition-transform duration-300
          ${isSelected ? 'scale-110' : ''}
        `}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

