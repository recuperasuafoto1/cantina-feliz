import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalConfirmacaoProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  variante?: 'destructive' | 'default';
}

export function ModalConfirmacao({
  aberto,
  onFechar,
  onConfirmar,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Sim',
  textoBotaoCancelar = 'Não',
  variante = 'default',
}: ModalConfirmacaoProps) {
  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{mensagem}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onFechar} className="btn-press">
            {textoBotaoCancelar}
          </Button>
          <Button
            variant={variante === 'destructive' ? 'destructive' : 'default'}
            onClick={() => { onConfirmar(); onFechar(); }}
            className="btn-press"
          >
            {textoBotaoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
