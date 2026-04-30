import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

function createIcon(displayName: string, viewBox: string, paths: React.ReactNode) {
  const Icon: React.FC<IconProps> = ({ size = 16, color = "currentColor", ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={color}
      role="img"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {paths}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

export const ExternalLinkIcon = createIcon(
  "ExternalLinkIcon",
  "0 0 16 16",
  <>
    <path fillRule="evenodd" clipRule="evenodd" d="M7.25 1C7.66414 1 7.99988 1.33589 8 1.75C8 2.16421 7.66421 2.5 7.25 2.5H4.75C3.50745 2.5 2.50012 3.50744 2.5 4.75V11.25C2.5 12.4926 3.50736 13.5 4.75 13.5H11.25C12.4926 13.5 13.5 12.4926 13.5 11.25V8.75C13.5001 8.33589 13.8359 8 14.25 8C14.6641 8 14.9999 8.33589 15 8.75V11.25C15 13.3211 13.3211 15 11.25 15H4.75C2.67893 15 1 13.3211 1 11.25V4.75C1.00012 2.67905 2.67899 1 4.75 1H7.25Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M13.4326 1.26953C13.7913 0.910937 14.3728 0.910883 14.7314 1.26953C15.0897 1.6282 15.0899 2.20981 14.7314 2.56836L9.2373 8.06152C8.68101 8.6177 7.94043 8.95161 7.15527 9C7.06754 9.0052 6.99468 8.93248 7 8.84473C7.04847 8.05961 7.38232 7.31897 7.93848 6.7627L13.4326 1.26953Z" />
  </>
);

export const BarLeftIcon: React.FC<IconProps & { barWidth?: number }> = ({
  size = 16,
  color = "currentColor",
  barWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    role="img"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.25 2C2.45508 2 1 3.45508 1 5.25V10.75C1 12.5449 2.45508 14 4.25 14H11.75C13.5449 14 15 12.5449 15 10.75V5.25C15 3.45508 13.5449 2 11.75 2H4.25ZM2.5 5.5C2.5 4.39543 3.39543 3.5 4.5 3.5H11.5C12.6046 3.5 13.5 4.39543 13.5 5.5V10.5C13.5 11.6046 12.6046 12.5 11.5 12.5H4.5C3.39543 12.5 2.5 11.6046 2.5 10.5V5.5Z" />
      <rect
        x="4" y="5" width={barWidth} height="6" rx="0.75"
        style={{ transitionProperty: "width", transitionDuration: "250ms" }}
      />
    </g>
  </svg>
);

export const CopyIcon = createIcon(
  "CopyIcon",
  "0 0 16 16",
  <>
    <path fillRule="evenodd" clipRule="evenodd" d="M13.25 5.25C14.2165 5.25 15 6.0335 15 7V11.75C15 13.5449 13.5449 15 11.75 15H6.75C5.7835 15 5 14.2165 5 13.25C5 12.8358 5.33579 12.5 5.75 12.5C6.16421 12.5 6.5 12.8358 6.5 13.25C6.5 13.3881 6.61193 13.5 6.75 13.5H11.75C12.7165 13.5 13.5 12.7165 13.5 11.75V7C13.5 6.86193 13.3881 6.75 13.25 6.75C12.8358 6.75 12.5 6.41421 12.5 6C12.5 5.58579 12.8358 5.25 13.25 5.25Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M8.1543 1.00391C9.73945 1.08421 11 2.39489 11 4V8L10.9961 8.1543C10.9184 9.68834 9.68834 10.9184 8.1543 10.9961L8 11H4L3.8457 10.9961C2.31166 10.9184 1.08163 9.68834 1.00391 8.1543L1 8V4C1 2.39489 2.26055 1.08421 3.8457 1.00391L4 1H8L8.1543 1.00391ZM4 2.5C3.17157 2.5 2.5 3.17157 2.5 4V8C2.5 8.82843 3.17157 9.5 4 9.5H8C8.82843 9.5 9.5 8.82843 9.5 8V4C9.5 3.17157 8.82843 2.5 8 2.5H4Z" />
  </>
);

export const TeamIcon = createIcon(
  "TeamIcon",
  "0 0 16 16",
  <>
    <path d="M12.5 13.5V15h-9v-1.5zm1-1v-9a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1V15l-.256-.013a2.5 2.5 0 0 1-2.231-2.231L1 12.5v-9a2.5 2.5 0 0 1 2.244-2.487L3.5 1h9l.256.013A2.5 2.5 0 0 1 15 3.5v9l-.013.256a2.5 2.5 0 0 1-2.231 2.231L12.5 15v-1.5a1 1 0 0 0 1-1" />
    <path d="M10 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0m1.405 6h-6.81c-.407 0-.714-.336-.55-.693.362-.79 1.344-1.974 3.98-1.974 2.648 0 3.597 1.196 3.935 1.986.152.355-.153.681-.555.681" />
  </>
);