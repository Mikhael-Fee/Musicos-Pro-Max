# Publicar no mesmo projeto Netlify

1. Abra o projeto **musicospromax** existente no Netlify. Não crie outro projeto.
2. Acesse **Project configuration → Build & deploy → Continuous deployment → Repository** e escolha **Link repository** (os rótulos podem variar com o idioma e a versão da interface).
3. Autorize o GitHub para acessar `Mikhael-Fee/Musicos-Pro-Max` e selecione esse repositório.
4. Se aparecer “repository is empty”, aguarde o primeiro envio para `main`, atualize a página e selecione novamente.
5. Configure a branch de produção como `main`, diretório base vazio, comando `npm run build` e diretório de publicação `dist`. O `netlify.toml` já contém o comando e o diretório.
6. Conclua em **Deploy project** ou equivalente. Acompanhe a implantação em **Deploys** até **Published**.
7. Abra `https://musicospromax.netlify.app/` e confira a identificação 2.0, os modos Explorar / Exercícios / Treino guiado, o violão em posição usual e a progressão 4–5–6–3. Teste o áudio após tocar em uma nota.

Depois do vínculo, novos commits em `main` disparam a publicação automaticamente, desde que os deploys automáticos estejam ativos. Uma atualização do Git não prova que o Netlify publicou: confirme o estado **Published** e o SHA do commit em **Deploys**. A validação do GitHub Actions é independente; por padrão o Netlify não espera essa validação. Execute `npm test` antes de enviar mudanças.

## Verificação e recuperação

- Build falhou: confira o log em **Deploys**, versão Node 24, comando e diretório acima.
- Site antigo: confirme a branch, o commit publicado e se há alguma publicação bloqueada ou pausada; recarregue a página.
- Sem som: toque numa nota, aumente o volume do app e do dispositivo e verifique o modo silencioso do aparelho.
- Para recuperar uma versão anterior, use uma implantação anterior em **Deploys** e a opção de publicá-la novamente. Para manter o Git alinhado depois, faça um commit de reversão da mudança problemática.

Não coloque tokens do Netlify no código ou em arquivos versionados. Não é necessário token no aplicativo quando o Netlify faz a publicação pelo GitHub. Sem uma integração autenticada com o Netlify, o agente pode enviar código ao GitHub, mas o vínculo inicial na conta precisa ser concluído pelo proprietário.
