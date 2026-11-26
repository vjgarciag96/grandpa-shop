import type { ReactNode } from 'react';
import { text } from './strings';

/** The app's mark and name at the start of a head, with what is shown under the name. */
export function AppTitle({ children }: { children?: ReactNode }) {
  return (
    <div className="desk__identity">
      <span className="desk__mark" aria-hidden="true" />
      <div>
        <h1>{text.binder.title}</h1>
        {children}
      </div>
    </div>
  );
}
