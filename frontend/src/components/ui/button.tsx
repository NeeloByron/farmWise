import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  { variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-white text-foreground hover:bg-muted',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      destructive: 'bg-destructive text-white hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: { default: 'h-11 px-4', sm: 'h-9 px-3 text-xs', lg: 'h-12 px-6', icon: 'size-11', 'icon-sm': 'size-9' },
  }, defaultVariants: { variant: 'default', size: 'default' } }
);
function Button({className,variant,size,...props}:ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({variant,size,className}))} {...props}/>;
}
export { Button, buttonVariants };
