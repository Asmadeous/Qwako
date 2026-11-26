import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ExternalLink, ImagePlus, Plus } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';

const input = 'rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700';

export const BlogAdminPage = () => {
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload } = useFetch('/admin/posts', { page });

  return (
    <div className="pb-16">
      <AccountNav
        description="Posts appear on the public Blog page once published."
        actions={
          <Link to="/account/blog/new" className={buttonVariants()}>
            <Plus aria-hidden className="size-4" />
            New post
          </Link>
        }
      />
      {loading && !data && <ListSkeleton rows={3} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data && data.posts.length === 0 && <p className="mx-4 text-ink/70">No posts yet. Write the first one with "New post".</p>}
      {data && data.posts.length > 0 && (
        <ul className="mx-4 divide-y divide-ink/10 rounded-[28px] bg-paper px-5 sm:px-6">
          {data.posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span className="min-w-0">
                <span className="block font-medium">{p.title}</span>
                <span className="block text-sm text-ink/65">
                  {p.published ? `Published ${formatDateTime(p.published_at)}` : `Draft, last saved ${formatDateTime(p.updated_at)}`}
                </span>
              </span>
              <span className="flex gap-2">
                {p.published && (
                  <Link to={`/blog/${p.slug}`} target="_blank" className={buttonVariants({ variant: 'outline' })}>
                    <ExternalLink aria-hidden className="size-4" />
                    View
                  </Link>
                )}
                <Link to={`/account/blog/${p.id}`} className={buttonVariants({ variant: 'outline' })}>
                  Edit
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="posts" className="mx-4" />}
    </div>
  );
};

const EMPTY = { title: '', slug: '', excerpt: '', cover_url: '', body: '', published: false };

export const BlogPostFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useFetch(id ? `/admin/posts/${id}` : null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (data?.post) setForm({ ...EMPTY, ...data.post, cover_url: data.post.cover_url ?? '', excerpt: data.post.excerpt ?? '' });
  }, [data]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (publish) => {
    setBusy(publish === undefined ? 'save' : publish ? 'publish' : 'unpublish');
    setFieldErrors({});
    try {
      const post = { title: form.title, slug: form.slug, excerpt: form.excerpt, body: form.body, cover_url: form.cover_url, publish: publish ?? form.published };
      const { data: res } = id ? await api.patch(`/admin/posts/${id}`, { post }) : await api.post('/admin/posts', { post });
      setForm({ ...EMPTY, ...res.post, cover_url: res.post.cover_url ?? '' });
      toast.success(res.post.published ? (publish ? 'Published.' : 'Saved. The post is live.') : publish === false ? 'Moved back to drafts.' : 'Draft saved.');
      if (!id) navigate(`/account/blog/${res.post.id}`, { replace: true });
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      setFieldErrors(Object.keys(fields).length ? fields : { base: errorMessageFrom(err) });
    } finally {
      setBusy('');
    }
  };

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('photos[]', file);
    setBusy('upload');
    try {
      const { data: res } = await api.post('/admin/uploads', body);
      setForm((f) => ({ ...f, cover_url: res.urls[0] }));
    } catch (err) {
      toast.error(errorMessageFrom(err));
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    setDeleteError('');
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success('Post deleted.');
      navigate('/account/blog', { replace: true });
    } catch (err) {
      setDeleteError(errorMessageFrom(err));
      setBusy('');
    }
  };

  if (id && loading && !data) return <ListSkeleton rows={4} />;
  if (id && error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const err = (key, label) => fieldErrors[key] && <span className="text-sm text-red-800">{fieldErrors[key] || label}</span>;

  return (
    <div className="pb-16">
      <AccountNav description={form.published ? 'This post is live on the Blog page.' : 'Drafts are only visible here.'} />
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="mx-4 grid max-w-3xl gap-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Title</span>
          <input value={form.title} onChange={set('title')} maxLength={150} required aria-invalid={fieldErrors.title ? 'true' : undefined} className={`${input} h-11`} />
          {err('title')}
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Web address</span>
          <span className="text-sm text-ink/65">/blog/{form.slug || 'made-from-the-title'}. Leave empty to make it from the title.</span>
          <input value={form.slug} onChange={set('slug')} maxLength={100} aria-invalid={fieldErrors.slug ? 'true' : undefined} className={`${input} h-11`} />
          {err('slug')}
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Short summary</span>
          <span className="text-sm text-ink/65">Shown in the list of posts and under the title.</span>
          <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} maxLength={300} aria-invalid={fieldErrors.excerpt ? 'true' : undefined} className={`${input} resize-y py-2`} />
          {err('excerpt')}
        </label>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Cover photo</span>
          {form.cover_url && <img src={form.cover_url} alt="" className="aspect-[16/9] w-full max-w-md rounded-2xl object-cover" />}
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonVariants({ variant: 'outline' })} cursor-pointer`}>
              <ImagePlus aria-hidden className="size-4" />
              {busy === 'upload' ? 'Uploading...' : 'Upload a photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadCover} disabled={busy === 'upload'} />
            </label>
            {form.cover_url && (
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, cover_url: '' })}>
                Remove photo
              </Button>
            )}
          </div>
          <input
            value={form.cover_url}
            onChange={set('cover_url')}
            placeholder="or paste an https:// photo link"
            aria-label="Cover photo link"
            aria-invalid={fieldErrors.cover_url ? 'true' : undefined}
            className={`${input} h-11`}
          />
          {err('cover_url')}
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Post</span>
          <span className="text-sm text-ink/65">Leave an empty line between paragraphs. Start a line with "## " for a heading.</span>
          <textarea value={form.body} onChange={set('body')} rows={18} maxLength={50000} required aria-invalid={fieldErrors.body ? 'true' : undefined} className={`${input} resize-y py-2`} />
          {err('body')}
        </label>
        {fieldErrors.base && <p role="alert" className="text-sm font-semibold text-red-800">{fieldErrors.base}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={Boolean(busy)} aria-busy={busy === 'save'}>
            {busy === 'save' ? 'Saving...' : form.published ? 'Save changes' : 'Save draft'}
          </Button>
          {form.published ? (
            <Button type="button" variant="outline" onClick={() => save(false)} disabled={Boolean(busy)}>
              Move back to drafts
            </Button>
          ) : (
            <Button type="button" onClick={() => save(true)} disabled={Boolean(busy)} aria-busy={busy === 'publish'}>
              {busy === 'publish' ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {id && (
            <Button type="button" variant="danger-outline" className="ml-auto" onClick={() => { setDeleteError(''); setDeleting(true); }} disabled={Boolean(busy)}>
              Delete post
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete "${form.title}"?`}
        confirmLabel="Delete post"
        busyLabel="Deleting..."
        busy={busy === 'delete'}
        error={deleteError}
        tone="danger"
        onConfirm={remove}
      >
        <p>The post is removed from the site. This can't be undone.</p>
      </ConfirmDialog>
    </div>
  );
};
