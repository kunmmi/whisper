/**
 * MicroExpander Component
 * A micro-interaction button that expands from a circular icon to a pill shape
 * containing text upon hover. It handles loading states by reverting to the
 * circular shape and displaying a spinner.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @param {Object} props
 * @param {string} props.text - The label text to display when the button is hovered/expanded
 * @param {React.ReactNode} [props.icon] - An optional custom icon. Defaults to a Plus icon if not provided
 * @param {'default' | 'outline' | 'ghost' | 'destructive'} [props.variant='default'] - The visual style variant of the button
 * @param {boolean} [props.isLoading=false] - If true, displays a spinner, disables interaction, and collapses the button
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Click handler
 * @param {Object} props - All other props are passed to the button element
 */
const MicroExpander = React.forwardRef(({
  text,
  icon,
  variant = 'default',
  isLoading = false,
  className,
  onClick,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const containerVariants = {
    initial: { width: '48px' },
    hover: { width: 'auto' },
    loading: { width: '48px' },
  };

  const textVariants = {
    initial: { opacity: 0, x: -10 },
    hover: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.15, duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      x: -5,
      transition: { duration: 0.1, ease: 'linear' },
    },
  };

  const variantStyles = {
    default: 'bg-blue-600 dark:bg-blue-700 text-white border border-blue-600 dark:border-blue-700',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-400',
    ghost: 'bg-gray-100 dark:bg-gray-800 border border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    destructive: 'bg-red-600 dark:bg-red-700 text-white border border-red-600 dark:border-red-700 hover:bg-red-700 dark:hover:bg-red-600',
  };

  const handleClick = (e) => {
    if (isLoading) return;
    onClick?.(e);
  };

  return (
    <motion.button
      ref={ref}
      className={cn(
        'relative flex h-12 items-center overflow-hidden rounded-full',
        'whitespace-nowrap font-medium text-sm uppercase tracking-wide',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-gray-900',
        isLoading && 'cursor-not-allowed',
        variantStyles[variant],
        className
      )}
      initial='initial'
      animate={isLoading ? 'loading' : isHovered ? 'hover' : 'initial'}
      variants={containerVariants}
      transition={{ type: 'spring', stiffness: 150, damping: 20, mass: 0.8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={text}
      {...props}
    >
      <div className='grid h-12 w-12 place-items-center shrink-0 z-10'>
        <AnimatePresence mode='popLayout'>
          {isLoading ? (
            <motion.div
              key='spinner'
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className='h-5 w-5 animate-spin' />
            </motion.div>
          ) : (
            <motion.div
              key='icon'
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {icon || <Plus className='h-5 w-5' />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div variants={textVariants} className='pr-6 pl-1'>
        {text}
      </motion.div>
    </motion.button>
  );
});

MicroExpander.displayName = 'MicroExpander';

export { MicroExpander };

