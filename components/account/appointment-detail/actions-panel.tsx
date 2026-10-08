import { Button } from '@/components/ui/button';
import { Panel } from '@/components/account/account-ui';
import { DESTRUCTIVE_BUTTON } from './modal';
import { formatGap, type ChangePolicy } from './policy';

export function ActionsPanel({
	policy,
	isRental,
	onCancel,
	onReschedule,
}: {
	policy: ChangePolicy;
	isRental: boolean;
	onCancel: () => void;
	onReschedule: () => void;
}) {
	if (!policy.canCancel && !policy.canReschedule) return null;
	return (
		<Panel title="Manage">
			<div className="flex flex-col gap-3 sm:flex-row">
				{policy.canReschedule ? (
					<Button variant="outline" onClick={onReschedule}>
						{isRental ? 'Change dates' : 'Reschedule'}
					</Button>
				) : null}
				{policy.canCancel ? (
					<button type="button" onClick={onCancel} className={DESTRUCTIVE_BUTTON}>
						Cancel booking
					</button>
				) : null}
			</div>
			{policy.cancelGap > 0 || policy.rescheduleGap > 0 ? (
				<div className="mt-5 space-y-1 text-xs text-[var(--color-ink-dim)]">
					{policy.cancelGap > 0 ? (
						<p>
							Cancel up to {formatGap(policy.cancelGap)} before {isRental ? 'pick-up' : 'the start'}.
						</p>
					) : null}
					{policy.rescheduleGap > 0 ? (
						<p>
							{isRental ? 'Change dates' : 'Reschedule'} up to {formatGap(policy.rescheduleGap)} before{' '}
							{isRental ? 'pick-up' : 'the start'}.
						</p>
					) : null}
				</div>
			) : null}
		</Panel>
	);
}
