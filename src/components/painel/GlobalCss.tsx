import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function GlobalCss() {
  const [cssCustomizado, setCssCustomizado] = useState<string>('');

  useEffect(() => {
    async function fetchCss() {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('css_personalizado')
        .eq('id', 1)
        .single();
      
      if (!error && data?.css_personalizado) {
        setCssCustomizado(data.css_personalizado);
      }
    }
    
    fetchCss();
    
    // Inscreve para ouvir mudanças na tabela configurações para hot-reload
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes_sistema',
          filter: 'id=eq.1'
        },
        (payload) => {
          if (payload.new && 'css_personalizado' in payload.new) {
            setCssCustomizado((payload.new as any).css_personalizado || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!cssCustomizado) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: cssCustomizado }} />
  );
}
