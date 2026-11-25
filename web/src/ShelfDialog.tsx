import { useState } from 'react';
import { Dialog } from './Dialog';
import type { BinderAddition, Shelf } from './shelf';
import { text } from './strings';

type NameProblem = Exclude<BinderAddition['kind'], 'added'>;

type Props = {
  shelf: Shelf;
  onOpen: (index: number) => void;
  onCreate: (name: string) => NameProblem | undefined;
  onClose: () => void;
};

export function ShelfDialog({ shelf, onOpen, onCreate, onClose }: Props) {
  const [problem, setProblem] = useState<NameProblem>();
  const words = text.shelf;

  return (
    <Dialog title={words.title} className="shelf-dialog" onClose={onClose}>
      <div className="binder-dialog__body">
        <p className="shelf-dialog__storage">{text.binder.storage}</p>
        <ul className="shelf-dialog__binders">
          {shelf.binders.map(({ name }, index) => (
            <li key={name}>
              <button
                type="button"
                className="control control--tonal"
                aria-current={index === shelf.activeIndex ? 'true' : undefined}
                onClick={() => onOpen(index)}
              >
                <span>{name}</span>
                {index === shelf.activeIndex && <span aria-hidden="true">{words.open}</span>}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="binder-dialog__form"
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            setProblem(onCreate(String(fields.get('name') ?? '')));
          }}
        >
          <label>
            {words.name}
            <input name="name" required onChange={() => setProblem(undefined)} />
          </label>
          {problem && (
            <p className="binder-dialog__error" role="alert">
              {problem === 'blank-name' ? words.blankName : words.duplicateName}
            </p>
          )}
          <button type="submit" className="control control--filled">
            {words.create}
          </button>
        </form>
      </div>
    </Dialog>
  );
}
