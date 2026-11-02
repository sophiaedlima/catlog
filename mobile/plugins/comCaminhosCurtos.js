const { withAppBuildGradle } = require('expo/config-plugins');

const ARGUMENTO = '-DCMAKE_OBJECT_PATH_MAX=240';

/**
 * No Windows, a compilação nativa falha com "Filename longer than 260 characters".
 * Este ajuste faz o CMake encurtar os nomes dos arquivos intermediários a cada "expo prebuild".
 */
module.exports = function comCaminhosCurtos(config) {
  return withAppBuildGradle(config, (modificado) => {
    if (!modificado.modResults.contents.includes(ARGUMENTO)) {
      modificado.modResults.contents = modificado.modResults.contents.replace(
        /defaultConfig\s*\{/,
        (trecho) => `${trecho}\n        externalNativeBuild {\n            cmake {\n                arguments "${ARGUMENTO}"\n            }\n        }`,
      );
    }
    return modificado;
  });
};
