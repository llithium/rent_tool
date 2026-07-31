try {
  const savedTheme = localStorage.getItem('rent-tool-theme');
  const theme =
    savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
} catch {
  document.documentElement.dataset.theme = 'light';
}
