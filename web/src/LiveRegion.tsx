import type { Announcement } from './announcement';

/** A status message read by assistive technology when its announcement changes. */
export function LiveRegion({
  announcement,
  className,
}: {
  announcement: Announcement;
  className: string;
}) {
  return (
    <p className={className} role="status">
      {announcement.text}
      {/* A repeated message must still change the text for a screen reader to say it again. */}
      {announcement.text && announcement.count % 2 === 1 && ' '}
    </p>
  );
}
