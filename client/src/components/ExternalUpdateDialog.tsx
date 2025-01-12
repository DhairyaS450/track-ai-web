import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

interface ExternalUpdateDialogProps {
  open: boolean;
  title: string;
  dialogContent: string;
  note?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExternalUpdateDialog({
  open,
  title,
  dialogContent,
  note,
  onConfirm,
  onCancel,
}: ExternalUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            {dialogContent}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {note}
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            No
          </Button>
          <Button onClick={onConfirm}>Yes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
