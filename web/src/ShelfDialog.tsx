import { BinderForm } from './BinderForm';
import { DEFAULT_BINDER_CAPACITY, type BinderCapacity } from './binder';
import { Dialog } from './Dialog';
import type { BinderAddition, Shelf } from './shelf';
import { text } from './strings';

type NameProblem = Exclude<BinderAddition['kind'], 'added'>;

type Props = {
  shelf: Shelf;
  onOpen: (index: number) => void;
  onCreate: (name: string, capacity: BinderCapacity) => NameProblem | undefined;
  onClose: () => void;
};

export function ShelfDialog({ shelf, onOpen, onCreate, onClose }: Props) {
  const words = text.shelf;

  return (
    <Dialog title={words.title} className="binder-dialog" onClose={onClose}>
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
        <BinderForm
          capacity={DEFAULT_BINDER_CAPACITY}
          action={words.create}
          onSubmit={(capacity, fields) => {
            const problem = onCreate(String(fields.get('name') ?? ''), capacity);
            if (problem === 'blank-name') return words.blankName;
            if (problem === 'duplicate-name') return words.duplicateName;
          }}
        >
          <label>
            {words.name}
            <input name="name" required />
          </label>
        </BinderForm>
      </div>
    </Dialog>
  );
}
