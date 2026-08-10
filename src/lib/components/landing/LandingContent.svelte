<script lang="ts">
  const benefits = [
    {
      number: '01',
      title: 'Set a rent ceiling you can defend',
      copy: 'Turn annual pay into a monthly target using estimated taxes and a clear housing budget.'
    },
    {
      number: '02',
      title: 'See the local market in context',
      copy: 'Compare your target with current one and two bedroom estimates before a listing pulls you off course.'
    },
    {
      number: '03',
      title: 'Keep better options within reach',
      copy: 'Check nearby suburbs, compare cities, and open apartment searches already filtered to your budget.'
    }
  ];

  const steps = [
    ['Choose a city', 'Search any supported United States city or begin with a familiar market.'],
    ['Add your salary', 'Enter the annual pay you are considering. You can adjust it at any time.'],
    [
      'Review the full picture',
      'See rent, take home pay, local context, nearby options, and direct search links.'
    ]
  ];

  const faqs = [
    {
      question: 'Where do the rent estimates come from?',
      answer:
        'Rent Tool uses Apartment List rent estimates for covered cities and HUD Fair Market Rents when a local estimate is not available. The source and reporting period appear with each result.'
    },
    {
      question: 'How current is the data?',
      answer:
        'Each result identifies its source and period. Apartment List estimates are bundled from the latest dataset included with the tool, while HUD values use fiscal year 2026 data.'
    },
    {
      question: 'Does the budget include taxes?',
      answer:
        'Yes. The estimate accounts for federal payroll and income taxes, plus available state and local tax context. It is a planning estimate, not tax advice.'
    },
    {
      question: 'Is the thirty percent rule required?',
      answer:
        'No. It is a starting point, not a rule you must follow. Use the salary control to test different scenarios and weigh the result against your own debts, savings, and priorities.'
    },
    {
      question: 'Is my salary saved?',
      answer:
        'Your plan is stored in your browser and reflected in the page address so you can return to it or share it. Rent Tool does not require an account.'
    }
  ];

  function reveal(node: HTMLElement) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.visible = 'true';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }

  function revealWord(node: HTMLElement, index: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timer = setTimeout(() => (node.dataset.visible = 'true'), index * 42);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -28% 0px', threshold: 0.5 }
    );

    observer.observe(node);
    return {
      destroy: () => {
        observer.disconnect();
        if (timer) clearTimeout(timer);
      }
    };
  }

  function focusCalculator() {
    const cityInput = document.querySelector<HTMLInputElement>('#city-input');
    if (!cityInput) return;

    const bounds = cityInput.getBoundingClientRect();
    const isVisible = bounds.top >= 0 && bounds.bottom <= window.innerHeight;

    cityInput.focus({ preventScroll: true });
    if (!isVisible) {
      cityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const tagline = 'Turn a salary offer into a move you can afford.';
</script>

<article aria-label="About Rent Tool" class="min-w-0">
  <section class="rounded-2xl bg-card-2 p-8 md:p-12">
    <p class="text-sm font-semibold text-accent">Move with confidence</p>
    <h1
      class="mt-4 max-w-2xl bg-linear-to-r from-black to-[#666666] bg-clip-text text-4xl font-semibold tracking-tight text-transparent md:text-6xl dark:from-white dark:to-[#9B9B9B]"
    >
      Know what rent fits<br class="hidden sm:block" /> before you move.
    </h1>
    <p class="mt-6 max-w-2xl text-base text-muted md:text-lg">
      Turn a salary offer into a practical rent budget, then compare it with current local
      estimates, taxes, and nearby options.
    </p>
    <button
      type="button"
      onclick={focusCalculator}
      class="mt-8 inline-flex rounded-xl bg-accent px-3 py-2 text-base font-semibold text-accent-ink no-underline shadow-card transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-y-px active:scale-98"
    >
      Check my rent budget
    </button>

    <div class="mt-10 border-t border-line pt-8">
      <p class="max-w-2xl text-sm text-muted">
        Built around
        <a
          class="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:decoration-accent"
          href="https://www.apartmentlist.com/research/category/data-rent-estimates"
          >Apartment List Rent Estimates</a
        >
        and fiscal year 2026 HUD Fair Market Rents, with the source shown beside every result.
      </p>
    </div>
  </section>

  <section use:reveal data-reveal class="py-20" aria-labelledby="benefits-heading">
    <p class="text-sm font-semibold text-accent">One plan, the numbers that matter</p>
    <h2
      id="benefits-heading"
      class="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl"
    >
      Decide with the market in view, not a rule of thumb alone.
    </h2>

    <div class="mt-12 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      {#each benefits as benefit, index (benefit.title)}
        <article class="rounded-2xl bg-card p-8 {index === 0 ? 'md:row-span-2 md:py-12' : ''}">
          <span class="text-sm font-semibold text-accent tabular-nums">{benefit.number}</span>
          <h3 class="mt-6 text-2xl font-semibold tracking-tight">{benefit.title}</h3>
          <p class="mt-4 max-w-xl text-base text-muted">{benefit.copy}</p>
        </article>
      {/each}
    </div>
  </section>

  <section use:reveal data-reveal class="border-y border-line py-20" aria-label="Core benefit">
    <p class="sr-only">Core benefit</p>
    <p class="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl" aria-label={tagline}>
      {#each tagline.split(' ') as word, index (`${word}-${index}`)}
        <span data-tagline-word aria-hidden="true" use:revealWord={index}>{word}</span>
      {/each}
    </p>
  </section>

  <section use:reveal data-reveal class="py-20" aria-labelledby="steps-heading">
    <p class="text-sm font-semibold text-accent">From offer to answer</p>
    <h2 id="steps-heading" class="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
      Three steps to a clearer rent target.
    </h2>
    <ol class="mt-12 space-y-4">
      {#each steps as step, index (step[0])}
        <li class="grid gap-4 rounded-2xl bg-card p-6 sm:grid-cols-[3rem_1fr] sm:p-8">
          <span class="text-sm font-semibold text-accent tabular-nums">0{index + 1}</span>
          <div>
            <h3 class="text-xl font-semibold">{step[0]}</h3>
            <p class="mt-2 max-w-xl text-base text-muted">{step[1]}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section use:reveal data-reveal class="border-t border-line py-20" aria-labelledby="faq-heading">
    <div class="grid gap-12 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <div>
        <p class="text-sm font-semibold text-accent">Questions, answered plainly</p>
        <h2 id="faq-heading" class="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Before you use the numbers.
        </h2>
      </div>
      <dl class="divide-y divide-line border-y border-line">
        {#each faqs as faq (faq.question)}
          <div class="py-6 first:pt-0 last:pb-0">
            <dt class="text-lg font-semibold">{faq.question}</dt>
            <dd class="mt-3 text-base text-muted">{faq.answer}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </section>

  <section use:reveal data-reveal class="rounded-2xl bg-ink p-8 text-canvas md:p-12">
    <p class="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
      Start with the salary. Leave with a rent target you understand.
    </p>
    <button
      type="button"
      onclick={focusCalculator}
      class="mt-8 inline-flex rounded-xl bg-canvas px-3 py-2 text-base font-semibold text-ink no-underline transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-card-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas active:translate-y-px active:scale-98"
    >
      Check my rent budget
    </button>
  </section>

  <footer
    class="flex flex-col gap-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
  >
    <p>© {new Date().getFullYear()} Rent Tool. Apartment List estimates © Apartment List, Inc.</p>
    <nav aria-label="Legal" class="flex gap-6">
      <a
        class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
        href="/privacy">Privacy</a
      >
      <a
        class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
        href="/terms">Terms</a
      >
    </nav>
  </footer>
</article>

<style>
  [data-reveal] {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(64px);
    transition:
      opacity 900ms cubic-bezier(0.32, 0.72, 0, 1),
      filter 900ms cubic-bezier(0.32, 0.72, 0, 1),
      transform 900ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  :global([data-reveal][data-visible='true']) {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }

  [data-tagline-word] {
    display: inline-block;
    margin-right: 8px;
    color: color-mix(in srgb, currentColor 30%, transparent);
    transition: color 800ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  :global([data-tagline-word][data-visible='true']) {
    color: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-reveal],
    [data-tagline-word] {
      opacity: 1;
      filter: none;
      transform: none;
      transition: none;
    }
  }
</style>
