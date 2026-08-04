<script lang="ts">
  import type { Budget, City, CitySuggestion } from '$lib/types';
  import type { SalaryField } from '$lib/salaryField.svelte';
  import { app } from '$lib/appState.svelte';
  import Brand from '$lib/components/ui/Brand.svelte';
  import CitySearch from '$lib/components/ui/CitySearch.svelte';
  import SalaryInput from '$lib/components/ui/SalaryInput.svelte';
  import SalarySlider from './SalarySlider.svelte';
  import CityActions from './CityActions.svelte';
  import BudgetCard from './BudgetCard.svelte';

  let {
    salary,
    selected,
    budget,
    onselect,
    onsalary
  }: {
    salary: SalaryField;
    selected: City | null;
    budget: Budget | null;
    onselect: (suggestion: CitySuggestion) => void;
    onsalary: (value: number) => void;
  } = $props();
</script>

<!-- Two-column view: the column stays pinned while the results scroll. It drops
     to static in the single-column layout below and scrolls away normally.
     `top` matches the page's top padding so it pins exactly where it rests. -->
<aside data-testid="sidebar" class="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8">
  <!-- Inside the sticky column so the brand pins with the inputs instead of
       scrolling away above them. -->
  <!-- In the single-column layout this row runs the full width and would slide
       under the fixed theme toggle, so it reserves the toggle's corner. -->
  <header class="flex flex-wrap items-center justify-between gap-5 py-1 max-lg:pr-14">
    <Brand />
    <a
      href="/compare"
      class="text-sm font-semibold text-accent no-underline hover:text-accent-deep"
    >
      Compare cities →
    </a>
  </header>

  <!-- One control surface for search, salary, actions, and the resulting budget. -->
  <section>
    <CitySearch {onselect} selectedName={app.selectedName} />

    <SalaryInput
      id="salary"
      label="Annual salary"
      value={salary.text}
      error={salary.error}
      oninput={salary.oninput}
      onblur={salary.onblur}
      onkeydown={salary.onkeydown}
      class="mt-4 mb-2.5"
    />
    <SalarySlider
      value={app.salary}
      oninput={(event) => onsalary(Number.parseInt((event.target as HTMLInputElement).value, 10))}
    />

    {#if selected}
      <CityActions cityName={selected.name} canShare={budget != null} />
    {/if}

    {#if selected && budget}
      <BudgetCard {budget} />
    {/if}
  </section>
</aside>
