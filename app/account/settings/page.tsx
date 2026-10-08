import type { Metadata } from 'next';
import { AccountHeading } from '@/components/account/account-ui';
import { ProfileForm } from '@/components/account/settings/profile-form';
import { PasswordForm } from '@/components/account/settings/password-form';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
	return (
		<div>
			<AccountHeading eyebrow="Settings" title="Account settings." intro="Your name, email and password." />
			<div className="mt-10 space-y-8">
				<ProfileForm />
				<PasswordForm />
			</div>
		</div>
	);
}
