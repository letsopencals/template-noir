'use client';

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { FloatingPanel } from './floating-panel';

export interface ListboxOption<V extends string = string> {
	value: V;
	label: string;
	/** Second line under the label (e.g. category). */
	description?: string | null;
	/** Leading visual (car thumbnail, icon). */
	leading?: ReactNode;
	/** Right-aligned detail (e.g. price per day). */
	trailing?: ReactNode;
}

export interface ListboxProps<V extends string = string> {
	value: V;
	options: ReadonlyArray<ListboxOption<V>>;
	onChange(value: V): void;
	/** Accessible name of the control. */
	label: string;
	/** Trigger contents. Default: the selected option's label. */
	renderValue?(option: ListboxOption<V> | undefined): ReactNode;
	className?: string;
	/** Panel width in px. Default: the trigger's width. */
	panelWidth?: number;
	align?: 'start' | 'end';
}

const CHEVRON = (
	<svg aria-hidden className="h-3 w-3 shrink-0 text-[var(--color-ink-muted)] transition-transform duration-300 group-aria-expanded/lb:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
		<path d="M2 4.5 6 8l4-3.5" />
	</svg>
);

const CHECK = (
	<svg aria-hidden className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
		<path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="square" />
	</svg>
);

/**
 * Branded single-select for pointer devices (WAI-ARIA listbox pattern):
 * a button opens a `FloatingPanel` list. Keyboard: ↑/↓ (opens when closed),
 * Home/End, type-ahead, Enter/Space selects, Escape/Tab closes. Focus stays on
 * the list and the active row is `aria-activedescendant`.
 * Callers keep a native `<select>` for touch devices (`pointer-coarse:`).
 */
export function Listbox<V extends string = string>({
	value,
	options,
	onChange,
	label,
	renderValue,
	className,
	panelWidth,
	align = 'start',
}: ListboxProps<V>) {
	const uid = useId();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const typeahead = useRef({ text: '', at: 0 });
	const [open, setOpen] = useState(false);
	const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
	const [active, setActive] = useState(selectedIndex);
	const selected = options.find((o) => o.value === value);

	const close = useCallback(() => setOpen(false), []);

	const openList = useCallback(() => {
		setActive(selectedIndex);
		setOpen(true);
	}, [selectedIndex]);

	const choose = useCallback(
		(i: number) => {
			const option = options[i];
			if (!option) return;
			onChange(option.value);
			setOpen(false);
			buttonRef.current?.focus({ preventScroll: true });
		},
		[options, onChange],
	);

	// Keep the active row in view while moving through the list.
	useEffect(() => {
		if (!open) return;
		listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
	}, [open, active]);

	const onTypeahead = useCallback(
		(key: string) => {
			const now = Date.now();
			const t = typeahead.current;
			t.text = now - t.at > 600 ? key.toLowerCase() : t.text + key.toLowerCase();
			t.at = now;
			const i = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
			if (i >= 0) setActive(i);
		},
		[options],
	);

	const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			openList();
		}
	};

	const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
		const last = options.length - 1;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setActive((i) => Math.min(last, i + 1));
				return;
			case 'ArrowUp':
				e.preventDefault();
				setActive((i) => Math.max(0, i - 1));
				return;
			case 'Home':
				e.preventDefault();
				setActive(0);
				return;
			case 'End':
				e.preventDefault();
				setActive(last);
				return;
			case 'Enter':
			case ' ':
				e.preventDefault();
				choose(active);
				return;
			case 'Tab':
				close();
				buttonRef.current?.focus({ preventScroll: true });
				return;
			default:
				if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) onTypeahead(e.key);
		}
	};

	const listId = `${uid}-list`;

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={open ? listId : undefined}
				aria-label={`${label}: ${selected?.label ?? ''}`}
				onClick={() => (open ? close() : openList())}
				onKeyDown={onButtonKeyDown}
				className={clsx('group/lb flex w-full min-w-0 items-center justify-between gap-3 text-left outline-none', className)}
			>
				<span className="min-w-0 flex-1 truncate">{renderValue ? renderValue(selected) : selected?.label}</span>
				{CHEVRON}
			</button>

			<FloatingPanel open={open} anchorRef={buttonRef} onClose={close} width={panelWidth} align={align} offset={14} initialFocus="[role=listbox]">
				<ul
					ref={listRef}
					id={listId}
					role="listbox"
					tabIndex={-1}
					aria-label={label}
					aria-activedescendant={`${uid}-opt-${active}`}
					onKeyDown={onListKeyDown}
					className="py-1.5 outline-none"
				>
					{options.map((o, i) => {
						const isSelected = o.value === value;
						const isActive = i === active;
						return (
							<li
								key={o.value}
								id={`${uid}-opt-${i}`}
								role="option"
								aria-selected={isSelected}
								data-index={i}
								onPointerMove={() => setActive(i)}
								onClick={() => choose(i)}
								className={clsx(
									'relative flex cursor-pointer items-center gap-4 px-4 py-2.5 transition-colors duration-200',
									isActive ? 'bg-[var(--color-surface-3)]' : '',
								)}
							>
								<span
									aria-hidden
									className={clsx(
										'absolute inset-y-2 left-0 w-px bg-[var(--color-primary)] transition-opacity duration-200',
										isActive || isSelected ? 'opacity-100' : 'opacity-0',
									)}
								/>
								{o.leading}
								<span className="min-w-0 flex-1">
									<span className={clsx('block truncate text-[0.92rem]', isSelected ? 'text-[var(--color-primary-bright)]' : 'text-[var(--color-ink)]')}>
										{o.label}
									</span>
									{o.description ? (
										<span className="mt-0.5 block truncate text-[0.6rem] uppercase tracking-[0.22em] text-[var(--color-ink-dim)]">{o.description}</span>
									) : null}
								</span>
								{o.trailing}
								{isSelected ? CHECK : <span aria-hidden className="w-3.5 shrink-0" />}
							</li>
						);
					})}
				</ul>
			</FloatingPanel>
		</>
	);
}
