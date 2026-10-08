'use client';

import { clsx } from 'clsx';
import type { ProductListVariantStaffMember } from '@opencals/storefront-sdk';
import { SafeImage } from '@/components/ui/safe-image';

interface StaffSelectorProps {
	staffMembers: ProductListVariantStaffMember[];
	selected: string | null;
	onSelect: (staffMemberId: string | null) => void;
	hideLabel?: boolean;
}

function imageUrl(staff: ProductListVariantStaffMember): string | null {
	return (staff.image as { url?: string } | null | undefined)?.url ?? null;
}

function initials(staff: ProductListVariantStaffMember): string {
	return `${staff.firstName?.[0] ?? ''}${staff.lastName?.[0] ?? ''}`.toUpperCase() || '·';
}

const CARD = 'group flex w-[132px] shrink-0 flex-col border text-left transition-colors duration-300';

/** Chauffeur cards: portrait, name, champagne frame when chosen. "Any" first. */
export function StaffSelector({ staffMembers, selected, onSelect, hideLabel = false }: StaffSelectorProps) {
	if (staffMembers.length === 0) return null;

	return (
		<div>
			{hideLabel ? null : <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--color-ink-muted)]">Your chauffeur</p>}
			<div data-lenis-prevent className={clsx('no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2', hideLabel ? '' : 'mt-4')} role="radiogroup" aria-label="Chauffeur">
				<button
					type="button"
					role="radio"
					aria-checked={selected === null}
					onClick={() => onSelect(null)}
					className={clsx(CARD, selected === null ? 'border-[var(--color-primary)]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]')}
				>
					<div className="flex aspect-[3/4] w-full items-center justify-center bg-[var(--color-surface)]">
						<span className="heading-display text-lg text-[var(--color-primary)]">Any</span>
					</div>
					<div className="px-3 py-2.5">
						<p className="text-sm text-[var(--color-ink)]">Any chauffeur</p>
						<p className="text-[0.68rem] text-[var(--color-ink-dim)]">Next available</p>
					</div>
				</button>

				{staffMembers.map((staff) => {
					const url = imageUrl(staff);
					const isSelected = selected === staff.id;
					const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Chauffeur';
					return (
						<button
							key={staff.id}
							type="button"
							role="radio"
							aria-checked={isSelected}
							onClick={() => onSelect(staff.id)}
							className={clsx(CARD, isSelected ? 'border-[var(--color-primary)]' : 'border-[var(--color-line-strong)] hover:border-[var(--color-primary-dark)]')}
						>
							<div className="image-placeholder relative aspect-[3/4] w-full overflow-hidden">
								<span className="heading-display absolute inset-0 flex items-center justify-center text-2xl text-[var(--color-ink-dim)]" aria-hidden>
									{initials(staff)}
								</span>
								{url ? (
									<SafeImage src={url} alt={name} fill sizes="132px" className="object-cover object-top grayscale transition duration-500 group-hover:grayscale-0" />
								) : null}
								{isSelected ? (
									<span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-[var(--color-primary)] text-black" aria-hidden>
										<svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
											<path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="square" />
										</svg>
									</span>
								) : null}
							</div>
							<div className="px-3 py-2.5">
								<p className={clsx('truncate text-sm', isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink)]')}>{name}</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
