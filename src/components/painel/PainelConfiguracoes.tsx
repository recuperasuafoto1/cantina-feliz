import { useState, useEffect } from 'react';
import { useTema, TEMAS } from '@/contexts/TemaContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Paintbrush, Save, Eye, EyeOff } from 'lucide-react';

export function PainelConfiguracoes() {
  const { temaAtual, mudarTema } = useTema();
  const { toast } = useToast();
  
  const [cssPersonalizado, setCssPersonalizado] = useState('');
  const [cssSalvo, setCssSalvo] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [previewAtivo, setPreviewAtivo] = useState(false);

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
    
    // Tenta atualizar ou inserir se não existir (upsert simples onde id=1)
    const { error } = await supabase
      .from('configuracoes_sistema')
      .upsert({ id: 1, css_personalizado: cssPersonalizado, updated_at: new Date().toISOString() });
      
    setSalvando(false);
    
    if (error) {
       toast({
         title: "Erro ao salvar",
         description: error.message,
         variant: "destructive"
       });
       return;
    }
    
    setCssSalvo(cssPersonalizado);
    setPreviewAtivo(false); // desliga preview pois agora é o oficial
    
    toast({
      title: "CSS salvo com sucesso!",
      description: "O estilo já está aplicado a todos os usuários."
    });
  };

  const handlePreview = () => {
    if (previewAtivo) {
       setPreviewAtivo(false);
       // Reverter se quisermos
    } else {
       setPreviewAtivo(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <h2 className="text-3xl font-extrabold tracking-tight">Configurações</h2>
      
      {/* Se manter preview ativo, injetamos só para o admin local */}
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

    </div>
  );
}
