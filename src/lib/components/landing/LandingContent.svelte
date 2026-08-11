<script lang="ts">
  function focusCalculator() {
    const cityInput = document.querySelector<HTMLInputElement>('#city-input');
    if (!cityInput) return;

    const bounds = cityInput.getBoundingClientRect();
    const isVisible = bounds.top >= 0 && bounds.bottom <= window.innerHeight;

    cityInput.focus({ preventScroll: true });
    if (!isVisible) cityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
</script>

<article aria-label="Start a rent plan" class="min-w-0">
  <section class="rounded-2xl bg-card-2 p-8 md:p-12">
    <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
      Start with the city and the offer.
    </h1>
    <p class="mt-5 max-w-2xl text-base text-muted md:text-lg">
      Choose the place you are considering and enter its annual salary. We will turn that into a
      monthly rent target and place it beside the local market.
    </p>
    <button
      type="button"
      onclick={focusCalculator}
      class="mt-8 inline-flex rounded-xl bg-accent px-3 py-2 text-base font-semibold text-accent-ink no-underline shadow-card transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-y-px active:scale-98"
    >
      Choose a city and salary
    </button>

    <div class="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
      <div>
        <h2 class="text-base font-semibold text-ink">A focused answer</h2>
        <p class="mt-1 text-sm text-muted">See a rent target before you browse listings.</p>
      </div>
      <div>
        <h2 class="text-base font-semibold text-ink">Local context</h2>
        <p class="mt-1 text-sm text-muted">Check it against the city’s current rent estimate.</p>
      </div>
      <div>
        <h2 class="text-base font-semibold text-ink">Your plan, saved</h2>
        <p class="mt-1 text-sm text-muted">Return to or share the scenario from its address.</p>
      </div>
    </div>

    <p class="mt-8 max-w-2xl text-sm text-muted">
      Sources and reporting periods appear beside every result. Rent Tool is a planning aid, not tax
      advice.
    </p>
  </section>
</article>
