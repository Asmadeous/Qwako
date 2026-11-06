// Page-level loading indicator in the site's ink colour.
const Spinner = ({ label = 'Loading' }) => (
  <div role="status" className="flex min-h-[60dvh] w-full items-center justify-center">
    <span className="size-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink motion-reduce:animate-none" />
    <span className="sr-only">{label}</span>
  </div>
);

export default Spinner;
