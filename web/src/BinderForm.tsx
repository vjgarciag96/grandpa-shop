import { useId, useState, type ReactNode } from 'react';
import {
  isBinderCapacity,
  MAX_BINDER_PAGES,
  MIN_BINDER_PAGES,
  POCKET_GRIDS,
  type BinderCapacity,
} from './binder';
import { text } from './strings';

type Props = {
  capacity: BinderCapacity;
  action: string;
  onSubmit: (capacity: BinderCapacity, fields: FormData) => string | undefined;
  children?: ReactNode;
};

export function BinderForm({ capacity, action, onSubmit, children }: Props) {
  const [problem, setProblem] = useState<string>();
  const pageHint = useId();
  const words = text.binderSettings;

  return (
    <form
      className="binder-dialog__form"
      onChange={() => setProblem(undefined)}
      onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        const requested = { grid: Number(fields.get('grid')), pages: Number(fields.get('pages')) };
        setProblem(
          isBinderCapacity(requested) ? onSubmit(requested, fields) : words.invalidCapacity,
        );
      }}
    >
      {children}
      <label>
        {words.grid}
        <select name="grid" defaultValue={capacity.grid} required>
          {POCKET_GRIDS.map((grid) => (
            <option key={grid} value={grid}>
              {words.gridOption(grid)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {words.pages}
        <input
          type="number"
          name="pages"
          required
          min={MIN_BINDER_PAGES}
          max={MAX_BINDER_PAGES}
          step={1}
          defaultValue={capacity.pages}
          aria-describedby={pageHint}
        />
      </label>
      <p className="binder-dialog__hint" id={pageHint}>
        {words.pageRange(MIN_BINDER_PAGES, MAX_BINDER_PAGES)}
      </p>
      {problem && (
        <p className="binder-dialog__error" role="alert">
          {problem}
        </p>
      )}
      <button type="submit" className="control control--filled">
        {action}
      </button>
    </form>
  );
}
