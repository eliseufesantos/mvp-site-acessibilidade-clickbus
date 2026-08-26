import { useEffect } from 'react';

const SCRIPT_ID = 'vlibras-plugin';
const SCRIPT_SRC = 'https://vlibras.gov.br/app/vlibras-plugin.js';

interface VLibrasWidgetProps {
  enabled: boolean;
}

/**
 * VLibras é o tradutor de Português para Libras mantido pelo governo brasileiro
 * (gov.br, LGPL-3.0). Alternativa gratuita ao Rybená, que é licenciado por plano.
 *
 * O script carregado aqui tem cerca de 2 KB e apenas desenha o botão flutuante;
 * o player 3D só é baixado quando a pessoa abre a tradução. Por isso ele é
 * injetado uma única vez, na primeira ativação, e a exibição do botão passa a
 * ser controlada por `html[data-libras]` em `components.css`.
 */
export function VLibrasWidget({ enabled }: VLibrasWidgetProps) {
  useEffect(() => {
    if (!enabled) {
      const player = document.getElementById('vlibras-app-root');
      if (player) player.dataset.active = 'false';
      return;
    }

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [enabled]);

  return null;
}
