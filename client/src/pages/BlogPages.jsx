import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import PostBody from '@/components/ui/PostBody';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { formatDate } from '@/utils/format';
import { listingPhotoProps } from '@/utils/images';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';

export const BlogPage = () => {
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload } = useFetch('/posts', { page });

  return (
    <div className="mx-auto w-full max-w-screen-xl px-5 pt-28 pb-24 md:px-8">
      <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Blog</h1>
      <p className="mt-3 max-w-xl text-ink/70">Stories from the homes, the places around them, and news from TG-Homes.</p>
      <div className="mt-10">
        {loading && !data && <ListSkeleton rows={3} />}
        {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
        {data && data.posts.length === 0 && <p className="text-ink/70">Nothing here yet. Check back soon.</p>}
        {data && data.posts.length > 0 && (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {data.posts.map((p) => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink/10">
                    {p.cover_url && (
                      <img
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        {...listingPhotoProps(p.cover_url, { sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' })}
                      />
                    )}
                  </div>
                  <p className="mt-4 text-sm text-ink/60">{formatDate(p.published_at)}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight group-hover:underline">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-ink/75">{p.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data && <Pagination {...pageProps(data)} onPage={setPage} label="posts" className="mt-12" />}
      </div>
    </div>
  );
};

export const BlogPostPage = () => {
  const { slug } = useParams();
  const { data, error, loading, reload, status } = useFetch(`/posts/${slug}`);
  const post = data?.post;

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-28 pb-24">
      <Link to="/blog" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Blog
      </Link>
      {loading && !data && <ListSkeleton rows={4} />}
      {error && status === 404 && (
        <div className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight">This post isn't here.</h1>
          <p className="mt-3 text-ink/70">It may have been taken down. Other posts are on the blog.</p>
          <Link to="/blog" className={`${buttonVariants()} mt-6`}>
            Read the blog
          </Link>
        </div>
      )}
      {error && status !== 404 && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {post && (
        <>
          <p className="mt-4 text-sm text-ink/60">
            {formatDate(post.published_at)}
            {post.author && `, ${post.author}`}
          </p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-xl text-ink/75">{post.excerpt}</p>}
          {post.cover_url && (
            <img alt="" className="mt-8 w-full rounded-3xl object-cover" {...listingPhotoProps(post.cover_url, { width: 1600, eager: true })} />
          )}
          <div className="mt-10">
            <PostBody text={post.body} />
          </div>
        </>
      )}
    </article>
  );
};
