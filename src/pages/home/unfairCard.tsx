import { Icon } from './icons'

interface UnfairCardProps {
  unfair: boolean
  spinning: boolean
  canReroll: boolean
  onToggle: () => void
  onReroll: () => void
}

const UnfairCard = ({
  unfair,
  spinning,
  canReroll,
  onToggle,
  onReroll
}: UnfairCardProps): JSX.Element => (
  <section className="card" aria-labelledby="unfair-label">
    <div className="setting">
      <div className="setting-text">
        <span className="setting-label" id="unfair-label">Unfair mode</span>
        <p className="setting-desc" id="unfair-desc">
          Gives every slice a random size. Bigger slices are more likely to win: each name&apos;s chance equals its share of the wheel.
        </p>
      </div>
      <button
        className="switch"
        id="unfair-switch"
        type="button"
        role="switch"
        aria-checked={unfair}
        aria-labelledby="unfair-label"
        aria-describedby="unfair-desc"
        disabled={spinning}
        onClick={onToggle}
      />
    </div>
    <div className="setting-extra">
      <button
        className="btn btn-quiet btn-sm"
        id="reroll-btn"
        type="button"
        disabled={spinning || !canReroll}
        onClick={onReroll}
      >
        <Icon name="dice" />
        Re-roll sizes
      </button>
    </div>
  </section>
)

export default UnfairCard
