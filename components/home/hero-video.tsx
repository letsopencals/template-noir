'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { SafeImage } from '@/components/ui/safe-image';

export interface HeroVideoProps {
	/** Looping background clip (e.g. /videos/hero.mp4). */
	src: string;
	/** Still frame shown under the video, and alone if the video is missing. */
	poster: string;
}

/**
 * Full-bleed background video for the hero. Layers, bottom to top: the
 * `.image-placeholder` gradient → the poster image (SafeImage, hides if
 * missing) → the muted looping <video> (removed if it fails to load). The
 * poster is rendered as an image rather than the `poster` attribute so it is
 * optimised by next/image and only downloaded once. Reduced motion: the video
 * is paused and the poster shows.
 */
export function HeroVideo({ src, poster }: HeroVideoProps) {
	const ref = useRef<HTMLVideoElement>(null);
	const reduce = useReducedMotion();
	const [failed, setFailed] = useState(false);

	// An error can fire before hydration attaches onError, so check once mounted.
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setFailed(true);
	}, []);

	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		if (reduce) video.pause();
		else void video.play().catch(() => undefined);
	}, [reduce]);

	return (
		<div aria-hidden className="image-placeholder absolute inset-0">
			<SafeImage src={poster} alt="" fill priority sizes="100vw" className="object-cover" />
			{failed ? null : (
				<video
					ref={ref}
					className="absolute inset-0 h-full w-full object-cover"
					src={src}
					autoPlay
					muted
					loop
					playsInline
					preload="metadata"
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}
