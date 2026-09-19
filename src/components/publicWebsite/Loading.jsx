export default function Loading() {
	return (
		<div className="loading-state" role="status" aria-live="polite">
			<div className="loading-mark" aria-hidden="true">
				<span className="loading-mark-letter">B</span>
				<span className="loading-mark-spark">+</span>
			</div>
			<div className="loading-copy">
				<p className="loading-kicker">TAKING A MOMENT</p>
				<p className="loading-message">Finding spaces that feel like home</p>
				<span className="loading-dots" aria-hidden="true">
					<span />
					<span />
					<span />
				</span>
			</div>
		</div>
	);
}
