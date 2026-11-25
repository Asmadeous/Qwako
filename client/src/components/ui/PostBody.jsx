// Blog text: paragraphs separated by a blank line, "## " lines as headings.
// Rendered as plain text, so nothing in a post can run as code.
const PostBody = ({ text }) => (
  <div className="grid gap-5 text-lg leading-relaxed">
    {text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, i) =>
        block.startsWith('## ') ? (
          <h2 key={i} className="mt-4 text-2xl font-bold tracking-tight">
            {block.slice(3)}
          </h2>
        ) : (
          <p key={i} className="whitespace-pre-line text-pretty">
            {block}
          </p>
        ),
      )}
  </div>
);

export default PostBody;
