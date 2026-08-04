<script lang="ts">
  const SLIDER_MIN = 30000;
  const SLIDER_MAX = 200000;

  /** The slider owns its own range; it and the number field share app.salary. */
  let { value, oninput }: { value: number | null; oninput: (event: Event) => void } = $props();

  let clamped = $derived(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value ?? SLIDER_MIN)));
  let fill = $derived(Math.round(((clamped - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100));
</script>

<input
  type="range"
  min={SLIDER_MIN}
  max={SLIDER_MAX}
  step="1000"
  value={clamped}
  style="--fill:{fill}%"
  aria-label="Annual salary slider"
  {oninput}
  class="w-full cursor-pointer appearance-none bg-transparent"
/>
<!-- --muted (not --faint) so these labels clear AA contrast on the canvas. -->
<div class="mt-1 flex justify-between text-xs text-muted tabular-nums">
  <span>$30k</span><span>drag to explore</span><span>$200k</span>
</div>

<style>
  /* Range-input internals are vendor pseudo-elements: no Tailwind utility can
     reach them, and the track needs a gradient stop driven by the --fill custom
     property the markup sets. */
  input::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 99px;
    background: linear-gradient(
      90deg,
      var(--accent) var(--fill, 40%),
      var(--line-strong) var(--fill, 40%)
    );
  }
  input::-moz-range-track {
    height: 6px;
    border-radius: 99px;
    background: var(--line-strong);
  }
  input::-moz-range-progress {
    height: 6px;
    border-radius: 99px;
    background: var(--accent);
  }
  input::-webkit-slider-thumb {
    appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -8px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--card);
    box-shadow: 0 1px 4px rgba(60, 40, 20, 0.35);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease;
  }
  input:hover::-webkit-slider-thumb,
  input:active::-webkit-slider-thumb {
    transform: scale(1.12);
    box-shadow: 0 2px 8px rgba(60, 40, 20, 0.4);
  }
  input::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--card);
    box-shadow: 0 1px 4px rgba(60, 40, 20, 0.35);
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease;
  }
  input:hover::-moz-range-thumb,
  input:active::-moz-range-thumb {
    transform: scale(1.12);
    box-shadow: 0 2px 8px rgba(60, 40, 20, 0.4);
  }
</style>
