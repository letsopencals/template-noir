'use client';

import {
	createContext,
	forwardRef,
	useContext,
	useId,
	type HTMLAttributes,
	type ReactNode,
} from 'react';
import {
	Controller,
	FormProvider,
	useFormContext,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
} from 'react-hook-form';
import { clsx } from 'clsx';

// Re-export FormProvider as Form
const Form = FormProvider;

// --- FormField ---

type FormFieldContextValue = { name: string };
const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	props: ControllerProps<TFieldValues, TName>,
) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

// --- useFormField ---

type FormItemContextValue = { id: string };
const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

function useFormField() {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	return {
		id: itemContext.id,
		name: fieldContext.name,
		formItemId: `${itemContext.id}-form-item`,
		formDescriptionId: `${itemContext.id}-form-item-description`,
		formMessageId: `${itemContext.id}-form-item-message`,
		...fieldState,
	};
}

// --- FormItem ---

const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const id = useId();
		return (
			<FormItemContext.Provider value={{ id }}>
				<div ref={ref} className={clsx('space-y-1.5', className)} {...props} />
			</FormItemContext.Provider>
		);
	},
);
FormItem.displayName = 'FormItem';

// --- FormLabel ---

const FormLabel = forwardRef<HTMLLabelElement, HTMLAttributes<HTMLLabelElement> & { htmlFor?: string }>(
	({ className, ...props }, ref) => {
		const { error, formItemId } = useFormField();
		return (
			<label
				ref={ref}
				htmlFor={formItemId}
				className={clsx(
					'block text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]',
					error && 'text-[#E5787A]',
					className,
				)}
				{...props}
			/>
		);
	},
);
FormLabel.displayName = 'FormLabel';

// --- FormControl ---

interface FormControlProps {
	children: ReactNode;
	className?: string;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
	({ children, className }, ref) => {
		return (
			<div ref={ref} className={className}>
				{children}
			</div>
		);
	},
);
FormControl.displayName = 'FormControl';

// --- FormDescription ---

const FormDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => {
		const { formDescriptionId } = useFormField();
		return (
			<p
				ref={ref}
				id={formDescriptionId}
				className={clsx('text-xs text-[var(--color-ink-dim)]', className)}
				{...props}
			/>
		);
	},
);
FormDescription.displayName = 'FormDescription';

// --- FormMessage ---

const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, children, ...props }, ref) => {
		const { error, formMessageId } = useFormField();
		const body = error ? String(error.message) : children;

		if (!body) return null;

		return (
			<p
				ref={ref}
				id={formMessageId}
				className={clsx('text-xs font-medium text-[#E5787A]', className)}
				{...props}
			>
				{body}
			</p>
		);
	},
);
FormMessage.displayName = 'FormMessage';

export {
	useFormField,
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
};
