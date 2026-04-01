import { useState, useEffect } from 'react';
import { useTema, TEMAS } from '@/contexts/TemaContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Paintbrush, Save, Eye, EyeOff, Trash2, AlertTriangle, Lock } from 'lucide-react';

const SENHA_LIMPEZA = 'Meusucesso*1';

type PeriodoLimpeza = 'hoje' | '7dias' | '30dias' | 'tudo';

export function PainelConfiguracoes() {
  const { temaAtual, mudarTema } = useTema();
  const { toast } = useToast();
  
  const [cssPersonalizado, setCssPersonalizado] = useState('');
  const [cssSalvo, setCssSalvo] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [previewAtivo, setPreviewAtivo] = useState(false);

  // Estado para limpeza de dados
  const [modalLimpeza, setModalLimpeza] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoLimpeza>('hoje');
  const [senhaLimpeza, setSenhaLimpeza] = useState('');
  const [etapaLimpeza, setEtapaLimpeza] = useState<'senha' | 'confirmar'>('senha');
  const [limpando, setLimpando] = useState(false);

  useEffect(() => {
    async function carregarConfiguracoes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('css_personalizado')
        .eq('id', 1)
        .single();
      
      if (!error && data) {
        setCssPersonalizado(data.css_personalizado || '');
        setCssSalvo(data.css_personalizado || '');
      }
      setLoading(false);
    }
    carregarConfiguracoes();
  }, []);

  const handleSalvarMenuCss = async () => {
    setSalvando(true);
    const { error } = await supabase
      .from('configuracoes_sistema')
      .upsert({ id: 1, css_personalizado: cssPersonalizado, updated_at: new Date().toISOString() });
      
    setSalvando(false);
    
    if (error) {
       toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
       return;
    }
    
    setCssSalvo(cssPersonalizado);
    setPreviewAtivo(false);
    toast({ title: "CSS salvo com sucesso!", description: "O estilo já está aplicado a todos os usuários." });
  };

  const handlePreview = () => {
    setPreviewAtivo(!previewAtivo);
  };

  // Limpeza de dados
  const abrirModalLimpeza = (periodo: PeriodoLimpeza) => {
    setPeriodoSelecionado(periodo);
    setSenhaLimpeza('');
    setEtapaLimpeza('senha');
    setModalLimpeza(true);
  };

  const verificarSenha = () => {
    if (senhaLimpeza !== SENHA_LIMPEZA) {
      toast({ title: 'Senha incorreta', description: 'Operação cancelada.', variant: 'destructive' });
      setModalLimpeza(false);
      return;
    }
    setEtapaLimpeza('confirmar');
  };

  const executarLimpeza = async () => {
    setLimpando(true);

    // Calcular filtro de data
    let filtroData: string | null = null;
    const agora = new Date();
    if (periodoSelecionado === 'hoje') {
      filtroData = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
    } else if (periodoSelecionado === '7dias') {
      const d = new Date(agora);
      d.setDate(d.getDate() - 7);
      filtroData = d.toISOString();
    } else if (periodoSelecionado === '30dias') {
      const d = new Date(agora);
      d.setDate(d.getDate() - 30);
      filtroData = d.toISOString();
    }
    // 'tudo' = filtroData null = sem filtro

    try {
      // 1. Buscar IDs dos pedidos no período
      let queryPedidos = supabase.from('pedidos').select('id');
      if (filtroData) queryPedidos = queryPedidos.gte('criado_em', filtroData);
      const { data: pedidos } = await queryPedidos;
      const pedidoIds = pedidos?.map(p => p.id) || [];

      // 2. Deletar itens_pedido dos pedidos selecionados
      if (pedidoIds.length > 0) {
        await supabase.from('itens_pedido').delete().in('pedido_id', pedidoIds);
      }

      // 3. Deletar pedidos
      if (filtroData) {
        await supabase.from('pedidos').delete().gte('criado_em', filtroData);
      } else {
        await supabase.from('pedidos').delete().gte('criado_em', '1970-01-01');
      }

      // 4. Deletar anotações
      if (filtroData) {
        await supabase.from('anotacoes_dia').delete().gte('criado_em', filtroData);
      } else {
        await supabase.from('anotacoes_dia').delete().gte('criado_em', '1970-01-01');
      }

      // 5. Deletar dívidas
      if (filtroData) {
        await supabase.from('dividas').delete().gte('criado_em', filtroData);
      } else {
        await supabase.from('dividas').delete().gte('criado_em', '1970-01-01');
      }

      // 6. Deletar movimentações de crédito
      if (filtroData) {
        await supabase.from('movimentacoes_credito').delete().gte('data', filtroData);
      } else {
        await supabase.from('movimentacoes_credito').delete().gte('data', '1970-01-01');
      }

      toast({ title: 'Dados removidos com sucesso', description: `Período: ${labelPeriodo(periodoSelecionado)}` });
    } catch (err: any) {
      toast({ title: 'Erro ao limpar dados', description: err.message, variant: 'destructive' });
    }

    setLimpando(false);
    setModalLimpeza(false);
  };

  const labelPeriodo = (p: PeriodoLimpeza) => {
    const map: Record<PeriodoLimpeza, string> = {
      hoje: 'Dados de hoje',
      '7dias': 'Últimos 7 dias',
      '30dias': 'Últimos 30 dias',
      tudo: 'Todo o período',
    };
    return map[p];
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h2 className="text-3xl font-extrabold tracking-tight">Configurações</h2>
      
      {previewAtivo && cssPersonalizado !== cssSalvo && (
         <style dangerouslySetInnerHTML={{ __html: cssPersonalizado }} />
      )}

      {/* Seletor de Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" />
            Tema de Cores da Aplicação
          </CardTitle>
          <CardDescription>Escolha o visual padrão da cantina e da área do operador</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMAS.map(tema => (
              <button
                key={tema.id}
                onClick={() => mudarTema(tema.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  temaAtual === tema.id
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                    : "border-border hover:border-primary/50 bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                   <span className="text-3xl">{tema.emoji}</span>
                   {temaAtual === tema.id && (
                     <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                   )}
                </div>
                <p className="font-bold">{tema.nome}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Injeção de CSS Global */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">🛠️ CSS Personalizado Global</CardTitle>
          <CardDescription>
             Escreva código CSS para sobrescrever o estilo em todo o sistema. 
             <strong className="text-destructive block mt-1">Cuidado: O código será aplicado automaticamente a todos os usuários após salvar.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Textarea
             value={cssPersonalizado}
             onChange={(e) => setCssPersonalizado(e.target.value)}
             placeholder={`/* Cole aqui seu CSS personalizado */\n\n.btn-custom {\n  background: red !important;\n}`}
             className="min-h-[300px] font-mono text-sm bg-muted/50 p-4"
             disabled={loading}
           />
           {cssPersonalizado !== cssSalvo && (
             <p className="text-sm text-amber-600 mt-2 font-medium">Você tem alterações não salvas.</p>
           )}
        </CardContent>
        <CardFooter className="flex gap-3 justify-end items-center bg-muted/30 p-4 border-t">
           <Button 
             variant={previewAtivo ? "secondary" : "outline"} 
             onClick={handlePreview}
             disabled={loading || cssPersonalizado === cssSalvo}
           >
             {previewAtivo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
             {previewAtivo ? "Parar Visualização" : "Visualizar Alterações"}
           </Button>
           
           <Button 
             onClick={handleSalvarMenuCss} 
             disabled={loading || salvando || cssPersonalizado === cssSalvo}
             className="min-w-[150px]"
           >
             {salvando ? "Salvando..." : (
               <>
                 <Save className="w-4 h-4 mr-2" />
                 Salvar Globalmente
               </>
             )}
           </Button>
        </CardFooter>
      </Card>

      {/* Limpeza de Dados */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Limpar Dados Históricos
          </CardTitle>
          <CardDescription>
            Remova pedidos, anotações, dívidas e movimentações de crédito por período.
            <strong className="text-destructive block mt-1">⚠️ Esta ação é irreversível!</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => abrirModalLimpeza('hoje')}>
              <Trash2 className="w-4 h-4 mr-2" /> Limpar dados de hoje
            </Button>
            <Button variant="outline" className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => abrirModalLimpeza('7dias')}>
              <Trash2 className="w-4 h-4 mr-2" /> Últimos 7 dias
            </Button>
            <Button variant="outline" className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => abrirModalLimpeza('30dias')}>
              <Trash2 className="w-4 h-4 mr-2" /> Últimos 30 dias
            </Button>
            <Button variant="destructive" onClick={() => abrirModalLimpeza('tudo')}>
              <AlertTriangle className="w-4 h-4 mr-2" /> Limpar todo período
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Limpeza */}
      <Dialog open={modalLimpeza} onOpenChange={setModalLimpeza}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              {etapaLimpeza === 'senha' ? 'Autenticação necessária' : 'Confirmar limpeza'}
            </DialogTitle>
            <DialogDescription>
              {etapaLimpeza === 'senha'
                ? `Para limpar "${labelPeriodo(periodoSelecionado)}", digite a senha de segurança.`
                : `Tem certeza? Esta ação não pode ser desfeita. Todos os dados de "${labelPeriodo(periodoSelecionado)}" serão removidos permanentemente.`
              }
            </DialogDescription>
          </DialogHeader>

          {etapaLimpeza === 'senha' ? (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Digite a senha de segurança"
                value={senhaLimpeza}
                onChange={(e) => setSenhaLimpeza(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verificarSenha()}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setModalLimpeza(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={verificarSenha} disabled={!senhaLimpeza}>
                  Verificar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setModalLimpeza(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={executarLimpeza} disabled={limpando}>
                {limpando ? 'Limpando...' : 'Sim, limpar tudo'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
