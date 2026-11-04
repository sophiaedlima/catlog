import { useCallback, useState } from 'react';
import { Avatar, Carregando, ErroComAcao, ItemLista, Opcoes, Rotulo, Tela, Vazio } from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { PropsTela } from '../navegacao/rotas';
import { periodoDaVisita, TEXTO_SITUACAO_VISITA, TOM_SITUACAO_VISITA } from '../servicos/formatacao';
import { listarVisitas } from '../servicos/visitaServico';
import { SituacaoVisita } from '../tipos/modelos';

type Filtro = 'TODAS' | 'ABERTAS' | 'CONCLUIDAS' | 'ENCERRADAS';

const SITUACOES: Record<Filtro, SituacaoVisita[] | undefined> = {
  TODAS: undefined,
  ABERTAS: ['SOLICITADA', 'ACEITA', 'EM_ANDAMENTO'],
  CONCLUIDAS: ['CONCLUIDA'],
  ENCERRADAS: ['RECUSADA', 'CANCELADA', 'EXPIRADA'],
};

export function VisitasTela({ navigation }: PropsTela<'Visitas'>) {
  const [filtro, setFiltro] = useState<Filtro>('TODAS');
  const { dados, carregando, erro, recarregar } = useDados(
    useCallback(() => listarVisitas({ situacoes: SITUACOES[filtro] }), [filtro]),
  );

  return (
    <Tela atualizando={carregando && !!dados} aoAtualizar={recarregar}>
      <Opcoes
        rotulo="Situação"
        valor={filtro}
        aoMudar={setFiltro}
        opcoes={[
          { valor: 'TODAS', texto: 'Todas' },
          { valor: 'ABERTAS', texto: 'Em aberto' },
          { valor: 'CONCLUIDAS', texto: 'Concluídas' },
          { valor: 'ENCERRADAS', texto: 'Não realizadas' },
        ]}
      />
      {carregando && !dados ? <Carregando texto="Carregando suas visitas..." /> : null}
      {erro && !dados ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {dados && dados.length === 0 ? <Vazio texto="Nenhuma visita aqui ainda." /> : null}
      {dados?.map((visita) => (
        <ItemLista
          key={visita.id}
          titulo={periodoDaVisita(visita.inicio, visita.fim)}
          subtitulo={`${visita.cuidador.nome}, com ${visita.gatos.map((g) => g.nome).join(' e ')}`}
          esquerda={<Avatar nome={visita.cuidador.nome} />}
          direita={<Rotulo texto={TEXTO_SITUACAO_VISITA[visita.situacao]} tom={TOM_SITUACAO_VISITA[visita.situacao]} />}
          aoTocar={() => navigation.navigate('DetalheVisita', { visitaId: visita.id })}
        />
      ))}
    </Tela>
  );
}
