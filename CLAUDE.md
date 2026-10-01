# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este repositório

É o host web de **Dourinho – O guardião das águas**, um jogo educativo em Unity WebGL para crianças de ~6 anos sobre consciência ambiental (quiz, cadastro do aluno, emissão de certificado). Os textos da interface e os comentários do código estão em português (pt-BR).

Este repositório contém **apenas o build WebGL compilado e a página HTML que o carrega**. O código-fonte Unity/C# não está aqui. Não é possível alterar a lógica do jogo, as cenas ou a interface dentro do jogo por este repositório. Essas mudanças são feitas no projeto Unity e exportadas de novo.

## Executando localmente

Não há etapa de build, gerenciador de pacotes, linter nem testes. Os passos `npm install` / `npm run dev` do README não se aplicam, porque não existe `package.json`.

O repositório fica em `C:\xampp\htdocs\dourinho`, então o Apache do XAMPP o serve em `http://localhost/dourinho/`. Qualquer servidor estático funciona, desde que envie o MIME type correto para `.wasm`. Abrir o `index.html` via `file://` não funciona.

## Arquitetura

- `index.html` é um template WebGL personalizado, não o padrão da Unity. Ele:
  - Carrega `Build/Dourinho.loader.js` dinamicamente e depois chama `createUnityInstance(canvas, config, onProgress)`.
  - Controla uma barra de carregamento própria (`#loadingOverlayBarra`, `#loadingText`). O canvas fica oculto até 3 segundos depois que a instância é criada; aí o loader some e o canvas aparece.
  - Mantém o canvas em 16:9 com `redimensionarCanvas()` nos eventos `load` e `resize`. A função altera só o `width`/`height` do CSS. Não altere `canvas.width` nem `canvas.height`: como explica o comentário no código, isso obriga a Unity a recriar o contexto de renderização. A resolução interna fica a cargo de `matchWebGLToCanvasSize: true` e `devicePixelRatio: 1.5`.
  - Detecta celular pelo user agent (`isMob`) e adiciona uma meta tag de viewport sem zoom. A chamada `unityInstance.SendMessage("MobileChange", "SetIsMob", isMob)` está comentada. Se for reativada, o build da Unity precisa ter um GameObject `MobileChange` com o método `SetIsMob(string)`.
  - Expõe as globais `FullScreen()` e `unityInstance` para que o jslib do C# do jogo possa chamá-las.
- `style.css` centraliza o canvas com posição absoluta (translate -50%) e estiliza o loader.
- `Build/` contém a saída da Unity com o prefixo `Dourinho.*`. Os arquivos `.unityweb` são comprimidos com o decompression fallback da Unity. Commits com nomes como "Otmizations" ou "ApiNativa" geralmente são só um build exportado de novo. Se o nome ou o prefixo do build mudar, atualize `loaderUrl` e `config` no `index.html`.

## Deploy / configuração do servidor

- `.htaccess` é para Apache (XAMPP ou um servidor Apache de produção). Ele define o MIME type de `.wasm` e as regras de gzip para builds `.gz`. O build atual usa `.unityweb`, e as linhas `AddEncoding gzip/br .unityweb` correspondentes estão comentadas. Para usar a descompressão nativa do navegador, descomente a que corresponde à compressão configurada na Unity.
- `_headers` é uma configuração de cabeçalhos no estilo Netlify/Cloudflare Pages. Ela libera CORS em `/Build/*` para `https://horizon-infinite.vercel.app`, o que indica que outro site carrega este build de outra origem. Mantenha essa origem, a menos que seja pedido o contrário.

## PWA

- `manifest.webmanifest` usa `favicon.png` (512×512) como ícone e `#06328F` como `theme_color`. Os caminhos são relativos (`./`) porque o site roda em subpasta (`/dourinho/`).
- `sw.js` usa a estratégia "rede primeiro" com o cache como fallback offline, para que um build novo da Unity nunca se misture com arquivos antigos. A lista `ARQUIVOS` repete os nomes de `Build/`: se eles mudarem, atualize a lista e incremente `CACHE`.
- O botão `#btnInstalar` (script no `index.html`) aparece quando o navegador dispara `beforeinstallprompt`. No iOS esse evento não existe, então o botão mostra a dica `#dicaIos` com as instruções manuais. O botão fica oculto quando o app já está aberto instalado.
- O service worker só funciona em `localhost` ou em HTTPS.
