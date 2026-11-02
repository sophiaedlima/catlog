import { Fredoka_500Medium, Fredoka_600SemiBold, useFonts } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConexaoProvider } from './src/contexto/ConexaoContext';
import { SessaoProvider, useSessao } from './src/contexto/SessaoContext';
import { Navegacao } from './src/navegacao/Navegacao';

SplashScreen.preventAutoHideAsync();

function Conteudo() {
  const { iniciando } = useSessao();
  const [fontesProntas, erroFontes] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold });
  const pronto = !iniciando && (fontesProntas || erroFontes !== null);

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync();
    }
  }, [pronto]);

  return pronto ? <Navegacao /> : null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ConexaoProvider>
        <SessaoProvider>
          <StatusBar style="light" />
          <Conteudo />
        </SessaoProvider>
      </ConexaoProvider>
    </SafeAreaProvider>
  );
}
