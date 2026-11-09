import { useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowDown, ArrowUp, Film, Trash2 } from 'lucide-react';

import { api, errorMessageFrom } from '@/utils/axios';

const MAX_VIDEOS = 10;
const MAX_MB = 200;

const iconButton =
  'grid size-9 place-items-center rounded-full bg-ink/70 text-sand transition-colors hover:bg-ink disabled:opacity-40';

// Owner uploads walkthrough videos; they play on the listing page in this order.
const VideosUploader = ({ videos, setVideos }) => {
  const [progress, setProgress] = useState(null);

  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length === 0) return;
    if (videos.length + files.length > MAX_VIDEOS) {
      toast.error(`A home can have at most ${MAX_VIDEOS} videos.`);
      return;
    }
    const tooBig = files.find((file) => file.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`${tooBig.name} is larger than ${MAX_MB} MB.`);
      return;
    }

    const data = new FormData();
    files.forEach((file) => data.append('videos[]', file));
    setProgress(0);
    try {
      const { data: result } = await api.post('/admin/uploads', data, {
        timeout: 0,
        onUploadProgress: ({ loaded, total }) => total && setProgress(Math.round((loaded / total) * 100)),
      });
      setVideos((prev) => [...prev, ...result.urls]);
    } catch (error) {
      toast.error(errorMessageFrom(error));
    } finally {
      setProgress(null);
    }
  };

  const move = (index, step) => {
    const next = [...videos];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    setVideos(next);
  };

  return (
    <div className="grid gap-3">
      {videos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {videos.map((url, index) => (
            <li key={url} className="relative overflow-hidden rounded-xl bg-ink">
              <video src={url} controls preload="metadata" playsInline className="aspect-video w-full">
                <track kind="captions" />
              </video>
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button type="button" aria-label={`Move video ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)} className={iconButton}>
                  <ArrowUp aria-hidden className="size-4" />
                </button>
                <button type="button" aria-label={`Move video ${index + 1} down`} disabled={index === videos.length - 1} onClick={() => move(index, 1)} className={iconButton}>
                  <ArrowDown aria-hidden className="size-4" />
                </button>
                <button type="button" aria-label={`Remove video ${index + 1}`} onClick={() => setVideos(videos.filter((v) => v !== url))} className={iconButton}>
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/30 px-4 py-6 text-center text-sm text-ink/70 transition-colors hover:border-ink hover:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
        <input
          type="file"
          multiple
          accept="video/mp4,video/webm,video/quicktime"
          className="sr-only"
          disabled={progress !== null}
          onChange={upload}
        />
        <Film aria-hidden strokeWidth={1.5} className="size-6" />
        {progress !== null ? (
          <span className="tabular" aria-live="polite">
            Uploading... {progress}%
          </span>
        ) : (
          <span>Upload videos (MP4, MOV or WebM, up to {MAX_MB} MB each)</span>
        )}
      </label>
    </div>
  );
};

export default VideosUploader;
