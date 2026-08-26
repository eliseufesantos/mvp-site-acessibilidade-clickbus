import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'yellow';
  fullWidth?: boolean;
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const widthClass = fullWidth ? ' button--full' : '';
  return (
    <button
      type={type}
      className={`button button--${variant}${widthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

