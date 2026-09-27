"use client";

import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { GlassButton } from "@/components/ui/glass-button";
import { Icon } from "@iconify/react";

type FeatureType = {
	title: string;
	icon: string | React.ElementType;
	description: string;
};

type FeatureCardProps = React.ComponentProps<'div'> & {
	feature: FeatureType;
};

export function FeatureCard({ feature, className, ...props }: FeatureCardProps) {
	const [p, setP] = useState<number[][]>([]);

	useEffect(() => {
		setP(genRandomPattern());
	}, []);

	return (
		<div className={cn('relative overflow-hidden p-6', className)} {...props}>
			<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)] z-0">
				<div className="from-white/10 to-white/0 group-hover:from-white/15 group-hover:to-transparent absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100 transition-colors duration-500">
					<GridPattern
						width={20}
						height={20}
						x="-12"
						y="4"
						squares={p}
						className="fill-white/5 stroke-white/10 group-hover:stroke-white/20 group-hover:fill-white/5 absolute inset-0 h-full w-full mix-blend-overlay transition-all duration-500"
					/>
				</div>
			</div>
            <div className="relative z-10 flex flex-col h-full">
			    <GlassButton size="icon" className="mb-4 group-hover:scale-110 transition-transform duration-500 pointer-events-none" tabIndex={-1}>
					{typeof feature.icon === 'string' ? (
						<Icon icon={feature.icon} className="text-white w-5 h-5 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] transition-all duration-500" aria-hidden />
					) : (
						<feature.icon className="text-white w-5 h-5 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] transition-all duration-500" strokeWidth={1.5} aria-hidden />
					)}
			    </GlassButton>
			    <h3 className="mt-4 text-sm tracking-widest text-white/90 uppercase">{feature.title}</h3>
			    <p className="text-white/40 relative z-20 mt-2 text-[11px] leading-relaxed font-light">{feature.description}</p>
            </div>
		</div>
	);
}

export function GridPattern({
	width,
	height,
	x,
	y,
	squares,
	...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
	const patternId = React.useId();

	return (
		<svg aria-hidden="true" {...props}>
			<defs>
				<pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
					<path d={`M.5 ${height}V.5H${width}`} fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
			{squares && (
				<svg x={x} y={y} className="overflow-visible">
					{squares.map(([x, y], index) => (
						<rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
					))}
				</svg>
			)}
		</svg>
	);
}

export function genRandomPattern(length?: number): number[][] {
	length = length ?? 5;
	return Array.from({ length }, () => [
		Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
		Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
	]);
}
