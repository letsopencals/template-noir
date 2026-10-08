import type { Metadata } from 'next';
import Link from 'next/link';
import { fleetContent, siteConfig } from '@/lib/site-config';
import { getFleet } from '@/lib/server-data';
import { PageHeading } from '@/components/ui/page-heading';
import { buttonClasses } from '@/components/ui/button';
import { PageSection } from '@/components/marketing/page-section';
import { Timeline } from '@/components/marketing/timeline';
import { IncludedList } from '@/components/marketing/included-list';
import { RequirementsGrid } from '@/components/marketing/requirements-grid';
import { DepositExplainer, type DepositRow } from '@/components/marketing/deposit-explainer';
import { PolicyBlock } from '@/components/marketing/policy-block';
import { titleFromSlug } from '@/components/marketing/format';
import { FinalCta } from '@/components/home/final-cta';

export const metadata: Metadata = {
	title: 'How it works',
	description: 'Book online, we deliver, we collect. What is included, what you need and how the deposit works.',
};

export default async function Page() {
	const fleet = await getFleet();
	const { marketing, contact } = siteConfig;

	// Deposit per car: live titles when the store responds, editorial data either way.
	const titles = new Map(fleet.map((c) => [c.slug, c.title]));
	const depositRows: DepositRow[] = Object.entries(fleetContent)
		.map(([slug, c]) => ({ slug, title: titles.get(slug) ?? titleFromSlug(slug), depositAed: c.depositAed, minAge: c.minAge }))
		.sort((a, b) => b.depositAed - a.depositAed);

	return (
		<>
			<PageHeading
				eyebrow="Overview"
				title={'How it\nworks'}
				intro="Book online, we deliver, we collect. What is included, what you need and how the deposit works."
			/>

			<PageSection index="01" eyebrow="The process" title={'Three steps,\nstart to finish.'}>
				<Timeline steps={siteConfig.howItWorks} />
			</PageSection>

			<PageSection index="02" eyebrow="The rate" title={'What the daily\nrate covers.'}>
				<IncludedList included={siteConfig.included} notIncluded={siteConfig.notIncluded} />
			</PageSection>

			<PageSection index="03" eyebrow="Before you book" title={'Driver\nrequirements.'} intro="You upload your licence and ID while booking, and we check them then.">
				<RequirementsGrid items={siteConfig.requirements} />
			</PageSection>

			<PageSection index="04" eyebrow="Deposit" title={marketing.deposit.heading.replace(', ', ',\n')}>
				<DepositExplainer steps={marketing.deposit.steps} rows={depositRows} />
			</PageSection>

			<PageSection index="05" eyebrow="Cancellation" title={marketing.cancellation.heading.replace(' and ', '\nand ')}>
				<PolicyBlock heading="If plans change" points={marketing.cancellation.points}>
					<div className="mt-10 flex flex-wrap gap-3">
						<Link href="/account" className={buttonClasses('outline', 'md')}>
							My bookings
						</Link>
						<a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses('ghost', 'md')}>
							WhatsApp the concierge
						</a>
					</div>
				</PolicyBlock>
			</PageSection>

			<FinalCta />
		</>
	);
}
