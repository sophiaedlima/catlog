import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import {
  Avatar,
  Botao,
  Carregando,
  ErroComAcao,
  Intro,
  ItemLista,
  Nota,
  Rotulo,
  Secao,
  Tela,
  TituloGrande,
} from '../componentes/Interface';
import { useDados } from '../componentes/useDados';
import { useSessao } from '../contexto/SessaoContext';
import { Rotas } from '../navegacao/rotas';
import { dataCurta, periodoDaVisita, TEXTO_SITUACAO_VISITA, TOM_SITUACAO_VISITA } from '../servicos/formatacao';
import { resumoTutor } from '../servicos/visitaServico';
import { cores } from '../tema/tema';
import { Visita } from '../tipos/modelos';

function resumoDosAlertas(vencidos: number, aVencer: number, temVisita: boolean): string {
  const partes: string[] = [];
  if (vencidos) partes.push(`${vencidos} ${vencidos === 1 ? 'cuidado atrasado' : 'cuidados atrasados'}`);
  if (aVencer) partes.push(`${aVencer} a vencer`);
  const saude = partes.length ? `Você tem ${partes.join(' e ')}.` : 'Os cuidados de saúde estão em dia.';
  return `${saude} ${temVisita ? 'A próxima visita já está marcada.' : 'Nenhuma visita marcada.'}`;
}

export function InicioTutorTela() {
  const navigation = useNavigation<NativeStackNavigationProp<Rotas>>();
  const abas = useNavigation<any>();
  const { usuario } = useSessao();
  const { dados, carregando, erro, recarregar } = useDados(resumoTutor);

  const cartaoVisita = (visita: Visita, dataTexto: string) => (
    <ItemLista
      titulo={dataTexto}
      subtitulo={`${visita.cuidador.nome}, com ${visita.gatos.map((g) => g.nome).join(' e ')}`}
      esquerda={<Avatar nome={visita.cuidador.nome} />}
      direita={<Rotulo texto={TEXTO_SITUACAO_VISITA[visita.situacao]} tom={TOM_SITUACAO_VISITA[visita.situacao]} />}
      aoTocar={() => navigation.navigate('DetalheVisita', { visitaId: visita.id })}
    />
  );

  return (
    <Tela atualizando={carregando && !!dados} aoAtualizar={recarregar}>
      <TituloGrande>Oi, {usuario?.nome.split(' ')[0]}</TituloGrande>
      {carregando && !dados ? <Carregando /> : null}
      {erro && !dados ? <ErroComAcao mensagem={erro} aoTentar={recarregar} /> : null}
      {dados ? (
        <>
          <Intro>
            {resumoDosAlertas(
              dados.alertas.filter((a) => a.situacao === 'VENCIDO').length,
              dados.alertas.filter((a) => a.situacao === 'A_VENCER').length,
              !!dados.proximaVisita,
            )}
          </Intro>
          {dados.alertas.map((alerta) => (
            <Nota
              key={alerta.itemId}
              tom={alerta.situacao === 'VENCIDO' ? 'erro' : 'alerta'}
              titulo={`${alerta.itemNome} de ${alerta.gatoNome} ${alerta.situacao === 'VENCIDO' ? 'venceu' : 'vai vencer'}`}
            >
              <Text style={{ color: cores.tinta }}>
                {alerta.situacao === 'VENCIDO' ? 'Atrasada desde' : 'Próxima dose em'} {dataCurta(alerta.proximaDose)}.
              </Text>
              <Botao
                titulo="Ver carteira de saúde"
                variante="secundario"
                aoTocar={() => navigation.navigate('CarteiraSaude', { gatoId: alerta.gatoId, gatoNome: alerta.gatoNome })}
              />
            </Nota>
          ))}
          <Secao>Próxima visita</Secao>
          {dados.proximaVisita ? (
            cartaoVisita(dados.proximaVisita, periodoDaVisita(dados.proximaVisita.inicio, dados.proximaVisita.fim))
          ) : (
            <Intro>Nenhuma visita confirmada no momento.</Intro>
          )}
          {dados.ultimaVisita ? (
            <>
              <Secao>Visita anterior</Secao>
              {cartaoVisita(dados.ultimaVisita, periodoDaVisita(dados.ultimaVisita.inicio, dados.ultimaVisita.fim))}
            </>
          ) : null}
          <Secao>Atalhos</Secao>
          <ItemLista titulo="Buscar cuidadores" subtitulo="Quem atende perto de você" aoTocar={() => abas.navigate('Cuidadores')} />
          <ItemLista
            titulo="Meus gatos"
            subtitulo={dados.nomesGatos.length ? dados.nomesGatos.join(', ') : 'Cadastre seu primeiro gato'}
            aoTocar={() => abas.navigate('Gatos')}
          />
          <ItemLista titulo="Todas as visitas" subtitulo="Pedidos, histórico e relatórios" aoTocar={() => navigation.navigate('Visitas')} />
        </>
      ) : null}
    </Tela>
  );
}
