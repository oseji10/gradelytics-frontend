import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  compact?: boolean; // Render with reduced paddings for tight layouts
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  compact = false,
}) => {
  const headerClass = compact ? 'px-4 py-3' : 'px-6 py-5';
  const bodyClass = compact ? 'p-3 border-t border-gray-100 dark:border-gray-800 sm:p-4' : 'p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6';
  const innerSpace = compact ? 'space-y-4' : 'space-y-6';

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className={headerClass}>
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className={bodyClass}>
        <div className={innerSpace}>{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
