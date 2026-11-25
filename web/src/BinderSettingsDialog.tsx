import { BinderForm } from './BinderForm';
import { Dialog } from './Dialog';
import type { BinderCapacity } from './binder';
import { text } from './strings';

type Props = {
  name: string;
  capacity: BinderCapacity;
  onSave: (capacity: BinderCapacity) => string | undefined;
  onClose: () => void;
};

export function BinderSettingsDialog({ name, capacity, onSave, onClose }: Props) {
  const words = text.binderSettings;

  return (
    <Dialog title={words.title} subtitle={name} className="binder-dialog" onClose={onClose}>
      <div className="binder-dialog__body">
        <BinderForm capacity={capacity} action={words.save} onSubmit={onSave} />
      </div>
    </Dialog>
  );
}
