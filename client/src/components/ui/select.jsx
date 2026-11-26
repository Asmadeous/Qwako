import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

// A dropdown styled like the rest of the site. `options` is [{ value, label }];
// values are strings, so callers convert numbers themselves.
const Select = React.forwardRef(
  ({ id, value, onValueChange, options, className, contentClassName, ...props }, ref) => (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        className={cn(
          'group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-paper px-3.5 text-left text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none data-[state=open]:border-ink',
          className,
        )}
        {...props}
      >
        <span className="truncate">
          <SelectPrimitive.Value />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-ink/60 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-ink/10 bg-paper p-1 text-ink shadow-[0_12px_32px_-8px_rgb(0_0_0/0.25)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-sand data-[state=checked]:font-semibold"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex">
                  <Check aria-hidden className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  ),
);
Select.displayName = 'Select';

export { Select };
