import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as TextoSvg } from 'react-native-svg';
import { nomeDoMes, numero } from '../servicos/formatacao';
import { cores } from '../tema/tema';
import { RegistroPeso } from '../tipos/modelos';

const ALTURA = 170;
const MARGEM = { esquerda: 34, direita: 12, topo: 12, base: 28 };
const MAXIMO_PONTOS = 8;

export function GraficoPeso({ registros }: { registros: RegistroPeso[] }) {
  const [largura, setLargura] = useState(320);
  const pontos = registros.slice(-MAXIMO_PONTOS);
  const pesos = pontos.map((r) => Number(r.pesoKg));
  const minimo = Math.min(...pesos) - 0.2;
  const maximo = Math.max(...pesos) + 0.2;
  const areaX = largura - MARGEM.esquerda - MARGEM.direita;
  const areaY = ALTURA - MARGEM.topo - MARGEM.base;

  const x = (i: number) => MARGEM.esquerda + (pontos.length === 1 ? areaX / 2 : (i * areaX) / (pontos.length - 1));
  const y = (peso: number) => MARGEM.topo + ((maximo - peso) / (maximo - minimo)) * areaY;

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const descricao = `Gráfico de peso: ${numero(Number(primeiro.pesoKg), 2)} quilos em ${nomeDoMes(primeiro.dataMedicao)} e ${numero(Number(ultimo.pesoKg), 2)} quilos em ${nomeDoMes(ultimo.dataMedicao)}`;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
    >
      <Svg width={largura} height={ALTURA}>
        <Line x1={MARGEM.esquerda} y1={ALTURA - MARGEM.base} x2={largura - MARGEM.direita} y2={ALTURA - MARGEM.base} stroke={cores.linha} strokeWidth={2} />
        <Line x1={MARGEM.esquerda} y1={MARGEM.topo} x2={MARGEM.esquerda} y2={ALTURA - MARGEM.base} stroke={cores.linha} strokeWidth={2} />
        <TextoSvg x={4} y={MARGEM.topo + 8} fontSize={12} fill={cores.tintaSuave}>{numero(maximo)}</TextoSvg>
        <TextoSvg x={4} y={ALTURA - MARGEM.base} fontSize={12} fill={cores.tintaSuave}>{numero(minimo)}</TextoSvg>
        <Polyline
          points={pontos.map((r, i) => `${x(i)},${y(Number(r.pesoKg))}`).join(' ')}
          fill="none"
          stroke={cores.verde}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pontos.map((r, i) => (
          <Circle
            key={r.id}
            cx={x(i)}
            cy={y(Number(r.pesoKg))}
            r={i === pontos.length - 1 ? 6 : 4}
            fill={r.alerta ? cores.vermelho : i === pontos.length - 1 ? cores.amarelo : cores.verde}
          />
        ))}
        {pontos.map((r, i) => (
          <TextoSvg key={`m${r.id}`} x={x(i)} y={ALTURA - 8} fontSize={12} fill={cores.tintaSuave} textAnchor="middle">
            {nomeDoMes(r.dataMedicao)}
          </TextoSvg>
        ))}
      </Svg>
    </View>
  );
}
