import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// The site's only button style: a pill in the site's font. Use it for every
// button and for links that look like buttons (asChild, or buttonVariants()).
// size "lg" is for the one main action that ends a form (sign in, book, save).
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-sand disabled:pointer-events-none disabled:opacity-60 motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        default: 'bg-ink text-sand hover:bg-ink/90',
        outline: 'border border-ink/25 bg-transparent text-ink hover:border-ink/60',
        danger: 'bg-red-800 text-white hover:bg-red-900',
        'danger-outline': 'border border-red-800/40 bg-transparent text-red-800 hover:border-red-800',
      },
      size: {
        default: 'h-11 px-6',
        lg: 'h-12 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, type, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      type={asChild ? undefined : type ?? 'button'}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
