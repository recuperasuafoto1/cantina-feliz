// Mapeamento de imagens dos produtos da cantina
import mistoQuente from '@/assets/misto-quente.jpg';
import sucoNatural from '@/assets/suco-natural.jpg';
import salgadoAssado from '@/assets/salgado-assado.jpg';
import boloDePote from '@/assets/bolo-de-pote.jpg';
import agua from '@/assets/agua.jpg';
import comboLanche from '@/assets/combo-lanche.jpg';

// Mapeamento por nome do produto para imagem local
const IMAGENS_PRODUTOS: Record<string, string> = {
  'Misto Quente': mistoQuente,
  'Suco Natural': sucoNatural,
  'Salgado Assado': salgadoAssado,
  'Bolo de Pote': boloDePote,
  'Água': agua,
  'Combo Lanche+Suco': comboLanche,
};

export function getImagemProduto(nome: string, imagemUrl?: string): string {
  // Se tem URL externa, usa ela
  if (imagemUrl && imagemUrl.startsWith('http')) return imagemUrl;
  // Senão, busca no mapeamento local
  return IMAGENS_PRODUTOS[nome] || '/placeholder.svg';
}
