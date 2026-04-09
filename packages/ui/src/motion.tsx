import {
  AnimatePresence,
  type HTMLMotionProps,
  LayoutGroup,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { cx, MASTER_MOTION_TOKENS, type MarketplaceMotionPreset } from './foundations';

export function MarketplaceMotionProvider({
  children,
  preset = 'rich',
}: {
  children: ReactNode;
  preset?: MarketplaceMotionPreset;
}) {
  return (
    <MotionConfig reducedMotion="user" transition={transitionForPreset(preset)}>
      <LayoutGroup>{children}</LayoutGroup>
    </MotionConfig>
  );
}

export function MarketplaceFadeIn({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      style={style}
      transition={prefersReducedMotion ? { duration: 0 } : transitionForPreset('rich')}
    >
      {children}
    </motion.div>
  );
}

export function MarketplaceAnimatedCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: 10 }}
      style={style}
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : transitionForPreset('rich')}
    >
      {children}
    </motion.div>
  );
}

export function MarketplaceAnimatedPresence({
  children,
  mode = 'wait',
}: {
  children: ReactNode;
  mode?: 'popLayout' | 'sync' | 'wait';
}) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

export function MarketplaceActivePill({ className, style }: { className?: string; style?: CSSProperties }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={cx('absolute inset-0 rounded-full', className)}
      layoutId="marketplace-active-pill"
      style={style}
      transition={prefersReducedMotion ? { duration: 0 } : transitionForPreset('rich')}
    />
  );
}

export function MotionAnchor({ children, className, style, ...props }: HTMLMotionProps<'a'>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.a
      {...props}
      className={className}
      style={style}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={prefersReducedMotion ? { duration: 0 } : transitionForPreset('rich')}
    >
      {children}
    </motion.a>
  );
}

export function MotionButton({ children, className, style, ...props }: HTMLMotionProps<'button'>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      {...props}
      className={className}
      style={style}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      transition={prefersReducedMotion ? { duration: 0 } : transitionForPreset('rich')}
    >
      {children}
    </motion.button>
  );
}

export function transitionForPreset(preset: MarketplaceMotionPreset) {
  if (preset === 'rich') {
    return {
      bounce: MASTER_MOTION_TOKENS.bounce,
      duration: MASTER_MOTION_TOKENS.durationPage,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      type: 'spring' as const,
      stiffness: MASTER_MOTION_TOKENS.springStiffness,
    };
  }

  return {
    duration: MASTER_MOTION_TOKENS.durationFast,
    ease: 'easeOut' as const,
  };
}
