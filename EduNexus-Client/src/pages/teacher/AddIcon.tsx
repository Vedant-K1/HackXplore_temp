import React from "react";

interface AddIconProps extends React.SVGProps<SVGSVGElement> {
  fill?: string;
  size?: number;
  height?: number;
  width?: number;
  label?: string;
}


export const AddIcon: React.FC<AddIconProps> = ({
  fill = 'currentColor',
  size,
  height,
  width,
  label,
  ...props
}) => {
  return (
    <svg
      width={size || width || 24}
      height={size || height || 24}
      viewBox="0 0 24 24"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label} // Use aria-label for accessibility
      {...props}
    >
      <path
        d="M12 5v14M5 12h14"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
