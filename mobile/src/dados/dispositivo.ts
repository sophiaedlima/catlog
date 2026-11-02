import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const LARGURA_MAXIMA_FOTO = 1600;
const QUALIDADE_FOTO = 0.7;

export class ErroDePermissao extends Error {}

/** Reduz a foto para cerca de 1 MB antes do envio (RNF08). */
async function comprimir(uri: string): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: LARGURA_MAXIMA_FOTO });
  const imagem = await contexto.renderAsync();
  const resultado = await imagem.saveAsync({ compress: QUALIDADE_FOTO, format: SaveFormat.JPEG });
  return resultado.uri;
}

export async function tirarFoto(): Promise<string | null> {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissao.granted) {
    throw new ErroDePermissao('Permita o uso da câmera nas configurações do celular para tirar fotos.');
  }
  const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  return resultado.canceled ? null : comprimir(resultado.assets[0].uri);
}

export async function escolherDaGaleria(): Promise<string | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  return resultado.canceled ? null : comprimir(resultado.assets[0].uri);
}

/** Copia a foto para uma pasta permanente, pois a do cache pode sumir antes de a internet voltar. */
export function guardarFotoPendente(uri: string): string {
  const pasta = new Directory(Paths.document, 'fotos-pendentes');
  if (!pasta.exists) {
    pasta.create({ intermediates: true, idempotent: true });
  }
  const destino = new File(pasta, `${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`);
  new File(uri).copy(destino);
  return destino.uri;
}

export function apagarFotoPendente(uri: string) {
  const arquivo = new File(uri);
  if (arquivo.exists) {
    arquivo.delete();
  }
}

export async function obterLocalizacao(): Promise<{ latitude: number; longitude: number }> {
  const permissao = await Location.requestForegroundPermissionsAsync();
  if (!permissao.granted) {
    throw new ErroDePermissao('Permita o uso da localização nas configurações do celular para fazer o check-in.');
  }
  const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
}
