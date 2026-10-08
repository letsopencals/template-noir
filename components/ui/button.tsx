import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	/**
	 * Letterspaced uppercase label (the default, automotive "spec plate" feel).
	 * Pass `caps={false}` for sentence-case buttons inside dense forms.
	 */
	caps?: boolean;
}

/**
 * NOIR buttons are squared (2px), hairline-precise and quiet. The champagne
 * fill is reserved for the one primary action on a surface.
 */
const BASE =
	'group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-[2px] font-medium transition-[background-color,border-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100';

const CAPS = 'uppercase tracking-[0.24em]';

const VARIANTS: Record<ButtonVariant, string> = {
	// Champagne fill, black text.
	primary: 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-bright)]',
	// Hairline outline that warms to champagne.
	outline:
		'border border-[var(--color-line-strong)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-bright)]',
	ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
};

const SIZES: Record<ButtonSize, string> = {
	sm: 'h-9 px-4 text-[0.66rem]',
	md: 'h-11 px-6 text-[0.7rem]',
	lg: 'h-14 px-9 text-[0.74rem]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = 'primary', size = 'md', fullWidth, caps = true, className, type = 'button', ...props },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			className={clsx(BASE, VARIANTS[variant], SIZES[size], caps && CAPS, fullWidth && 'w-full', className)}
			{...props}
		/>
	);
});

/**
 * Class string for `next/link` anchors that should look like a Button (Button
 * renders a <button> and has no anchor mode). Usage:
 * `<Link href="/book" className={buttonClasses('primary', 'lg')}>Book a car</Link>`
 */
export function buttonClasses(
	variant: ButtonVariant = 'primary',
	size: ButtonSize = 'md',
	opts: { caps?: boolean; fullWidth?: boolean; className?: string } = {},
): string {
	const { caps = true, fullWidth, className } = opts;
	return clsx(BASE, VARIANTS[variant], SIZES[size], caps && CAPS, fullWidth && 'w-full', className);
}
