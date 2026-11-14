import { Link } from 'react-router-dom';

import { timeAgo } from '@/utils/format';
import { cn } from '@/lib/utils';

// Rows of conversations, unread ones in bold with a dot.
const ConversationList = ({ conversations, linkBase, owner = false }) => (
  <ul className="mx-4 divide-y divide-ink/10 border-y border-ink/10">
    {conversations.map((c) => (
      <li key={c.id}>
        <Link
          to={`${linkBase}/${c.id}`}
          className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-start gap-3 py-4 transition-colors hover:bg-ink/[0.03]"
        >
          <span className={cn('mt-2 size-2 rounded-full', c.unread ? 'bg-red-700' : 'bg-transparent')}>
            {c.unread && <span className="sr-only">Unread</span>}
          </span>
          <span className="min-w-0">
            <span className={cn('block truncate', c.unread ? 'font-bold' : 'font-medium')}>
              {owner ? `${c.guest.name}: ${c.subject}` : c.subject}
            </span>
            <span className="block truncate text-sm text-ink/65">{c.preview}</span>
          </span>
          <span className="text-xs text-ink/55">{timeAgo(c.last_message_at)}</span>
        </Link>
      </li>
    ))}
  </ul>
);

export default ConversationList;
