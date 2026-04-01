import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Trash2 } from 'lucide-react';

const categorias = {
  saude: { nome: 'Médico/Saúde', icon: '🏥' },
  dentista: { nome: 'Dentista/Saúde', icon: '🦷' },
  educacao: { nome: 'Educação', icon: '📚' },
  previdencia_privada: { nome: 'Previdência Privada', icon: '🏦' },
  pensao_alimenticia: { nome: 'Pensão Alimentícia', icon: '⚖️' },
  dependentes: { nome: 'Dependentes', icon: '👨‍👩‍👧' },
  alimentacao: { nome: 'Alimentação', icon: '🍽️' },
  transporte: { nome: 'Transporte', icon: '🚗' },
  moradia: { nome: 'Moradia', icon: '🏠' },
  servicos: { nome: 'Serviços', icon: '🔧' },
  vestuario: { nome: 'Vestuário', icon: '👔' },
  pets: { nome: 'Pets', icon: '🐾' },
  farmacia: { nome: 'Farmácia', icon: '💊' },
  outros: { nome: 'Outros', icon: '📦' },
};

export default function EditNotaModal({ nota, onClose }) {
  const queryClient = useQueryClient();
  const [dados, setDados] = useState({ ...nota });
  const [confirmarDelete, setConfirmarDelete] = useState(false);

  const handleChange = (field, value) => {
    setDados(prev => ({ ...prev, [field]: value }));
  };

  const updateMutation = useMutation({
    mutationFn: (updated) => base44.entities.NotaFiscal.update(nota.id, updated),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['notas'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notas'] });
      queryClient.setQueriesData({ queryKey: ['notas'] }, (old) =>
        old ? old.map((n) => (n.id === nota.id ? { ...n, ...updated } : n)) : old
      );
      return { snapshots };
    },
    onError: (_err, _updated, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error('Erro ao salvar a nota. As alterações foram revertidas.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notas'] }),
    onSuccess: () => onClose(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.NotaFiscal.delete(nota.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notas'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notas'] });
      queryClient.setQueriesData({ queryKey: ['notas'] }, (old) =>
        old ? old.filter((n) => n.id !== nota.id) : old
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error('Erro ao deletar a nota. A operação foi revertida.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notas'] }),
    onSuccess: () => onClose(),
  });

  const salvando = updateMutation.isPending;
  const deletando = deleteMutation.isPending;

  const handleSalvar = () => updateMutation.mutate(dados);
  const handleDeletar = () => deleteMutation.mutate();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0"
        aria-modal="true"
        aria-label={`Editar nota fiscal de ${nota.estabelecimento || 'estabelecimento'}`}
        aria-describedby="edit-nota-desc"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle id="edit-nota-desc">Editar Nota Fiscal</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {nota.imagem_url && (
            <img src={nota.imagem_url} alt="Nota fiscal" className="w-full max-h-48 object-contain rounded-lg shadow-md" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-estabelecimento">Estabelecimento</Label>
              <Input id="edit-estabelecimento" value={dados.estabelecimento || ''} onChange={e => handleChange('estabelecimento', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input id="edit-cnpj" value={dados.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-valor">Valor Total (R$)</Label>
              <Input id="edit-valor" type="number" step="0.01" value={dados.valor_total || ''} onChange={e => handleChange('valor_total', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="edit-data">Data de Emissão</Label>
              <Input id="edit-data" type="date" value={dados.data_emissao || ''} onChange={e => handleChange('data_emissao', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-numero">Número da Nota</Label>
              <Input id="edit-numero" value={dados.numero_nota || ''} onChange={e => handleChange('numero_nota', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={dados.categoria} onValueChange={val => handleChange('categoria', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categorias).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>{cat.icon} {cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-obs">Observações</Label>
            <Textarea id="edit-obs" value={dados.observacoes || ''} onChange={e => handleChange('observacoes', e.target.value)} rows={3} />
          </div>

        </div>

        {/* Rodapé fixo — sempre visível independente do scroll */}
        <div className="flex justify-between px-6 py-4 border-t bg-background">
            {!confirmarDelete ? (
              <Button variant="destructive" aria-label="Deletar nota fiscal" onClick={() => setConfirmarDelete(true)} className="gap-2 min-h-[44px]">
                <Trash2 className="w-4 h-4" />
                Deletar Nota
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-destructive">Tem certeza?</span>
                <Button variant="destructive" aria-label="Confirmar exclusão" onClick={handleDeletar} disabled={deletando} size="sm" className="min-h-[44px]">
                  {deletando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, deletar'}
                </Button>
                <Button variant="ghost" aria-label="Cancelar exclusão" onClick={() => setConfirmarDelete(false)} size="sm" className="min-h-[44px]">Cancelar</Button>
              </div>
            )}

            <Button onClick={handleSalvar} disabled={salvando} aria-label="Salvar alterações" className="gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700">
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
