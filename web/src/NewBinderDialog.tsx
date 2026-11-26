import { BinderForm } from './BinderForm';
import { DEFAULT_BINDER_CAPACITY, type BinderCapacity } from './binder';
import { Dialog } from './Dialog';
import type { NameProblem } from './shelf';
import { text } from './strings';

type Props = {
  onCreate: (name: string, capacity: BinderCapacity) => NameProblem | undefined;
  onClose: () => void;
};

export function NewBinderDialog({ onCreate, onClose }: Props) {
  const words = text.shelf;

  return (
    <Dialog title={words.newBinder} className="binder-dialog" onClose={onClose}>
      <div className="binder-dialog__body">
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
            {/* The name comes first, so the dialog opens on it rather than on Close. */}
            <input name="name" required autoFocus />
          </label>
        </BinderForm>
      </div>
    </Dialog>
  );
}
