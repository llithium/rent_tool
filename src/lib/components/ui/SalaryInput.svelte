<script lang="ts">
  /**
   * The underlined "$ 80,000" salary field, shared by the city view (`lg`) and
   * each compare scenario (`md`). The parent owns parsing and validation; this
   * component owns the field chrome and error wiring.
   */
  let {
    id,
    label,
    value,
    error = '',
    size = 'lg',
    ariaLabel,
    oninput,
    onblur,
    onkeydown,
    class: className = ''
  }: {
    id: string;
    label: string;
    value: string;
    error?: string;
    size?: 'lg' | 'md';
    ariaLabel?: string;
    oninput: (event: Event) => void;
    onblur?: () => void;
    onkeydown?: (event: KeyboardEvent) => void;
    class?: string;
  } = $props();
</script>

<div class={className}>
  <label for={id} class="mb-1.5 block text-xs font-semibold tracking-[0.08em] text-muted uppercase">
    {label}
  </label>
  <div
    class="flex items-baseline gap-0.5 border-b-2 focus-within:border-accent {error
      ? 'border-red'
      : 'border-line-strong'}"
  >
    <span class="text-muted {size === 'lg' ? 'text-2xl' : 'text-lg'}">$</span>
    <input
      {id}
      type="text"
      inputmode="numeric"
      aria-label={ariaLabel}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : undefined}
      {value}
      {oninput}
      {onblur}
      {onkeydown}
      class="w-full min-w-0 flex-1 border-0 bg-transparent py-0.5 font-bold tracking-tight text-ink tabular-nums outline-none placeholder:text-faint {size ===
      'lg'
        ? 'text-3xl'
        : 'text-2xl'}"
      placeholder="e.g. 65,000"
    />
  </div>
  {#if error}
    <span id={`${id}-error`} class="mt-2 block text-xs text-red">{error}</span>
  {/if}
</div>
