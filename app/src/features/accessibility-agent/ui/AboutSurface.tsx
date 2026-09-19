import { ShieldCheck } from 'lucide-react';

/**
 * Limites e créditos. Esta superfície existe para que a demonstração não se
 * apresente como mais do que é: nenhuma alegação de conformidade, de IA
 * confiável ou de tradução homologada sai daqui.
 */
export function AboutSurface() {
  return (
    <div className="a11y-about">
      <section className="a11y-section" aria-labelledby="about-what-title">
        <div className="a11y-section__heading"><h4 id="about-what-title"><ShieldCheck aria-hidden="true" /> O que este painel faz</h4></div>
        <p>
          Os ajustes visuais são aplicados localmente, funcionam sem rede e ficam salvos neste navegador.
          O assistente entende o pedido em linguagem natural e devolve um plano; quem valida e aplica é o
          executor local, aqui no seu navegador.
        </p>
      </section>

      <section className="a11y-section" aria-labelledby="about-limits-title">
        <div className="a11y-section__heading"><h4 id="about-limits-title">Limites conhecidos</h4></div>
        <ul className="a11y-about__list">
          <li>Protótipo acadêmico com dados fictícios. Nenhuma passagem é vendida, reservada ou paga.</li>
          <li>A verificação automatizada de acessibilidade cobre apenas parte dos critérios WCAG. Ausência de erro automatizado não é conformidade comprovada.</li>
          <li>Não houve homologação com pessoas usuárias de leitor de tela nem com pessoas surdas sinalizantes.</li>
          <li>A explicação por IA ainda não foi aprovada em avaliação semântica. Termos conhecidos usam o glossário local, que é determinístico.</li>
          <li>Dados de passageiro, pagamento, bilhete e confirmação nunca são enviados ao assistente nem às ferramentas de conteúdo.</li>
        </ul>
      </section>

      <section className="a11y-section" aria-labelledby="about-credits-title">
        <div className="a11y-section__heading"><h4 id="about-credits-title">Créditos</h4></div>
        <p>
          Tradução em Libras por <a href="https://www.rybena.com.br/" target="_blank" rel="noreferrer">Rybená</a>,
          usada apenas para Libras e voz. Os ajustes visuais são implementação própria deste projeto.
        </p>
      </section>
    </div>
  );
}
