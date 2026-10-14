# scripts/planalto

Ferramentas que montam o **rascunho** da base de conhecimento a partir do texto oficial publicado no Planalto. Usam só a biblioteca padrão do Python 3.

| Script       | O que faz                                                                                                                                                                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extrair.py` | Lê a página da norma (windows-1252), **descarta a redação revogada** (texto riscado com `<strike>` ou `text-decoration: line-through`), separa notas de alteração ("Redação dada pela...") e agrupa os parágrafos por artigo. Artigos citados entre aspas (ex.: os do ADCT inseridos pela EC 132) ficam marcados com o artigo que os cita. |
| `montar.py`  | Copia **literalmente** os parágrafos escolhidos de cada dispositivo para `knowledge/rascunho.json`. Nada é redigido: a lista de dispositivos e seletores está no próprio script.                                                                                                                                                           |

## Como reproduzir

```bash
mkdir -p /tmp/planalto/fontes /tmp/planalto/extraido
curl -sSL -o /tmp/planalto/fontes/lcp214.htm https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm
curl -sSL -o /tmp/planalto/fontes/emc132.htm https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm
python3 -I scripts/planalto/extrair.py /tmp/planalto/fontes/lcp214.htm /tmp/planalto/extraido/lcp214.json
python3 -I scripts/planalto/extrair.py /tmp/planalto/fontes/emc132.htm /tmp/planalto/extraido/emc132.json
python3 -I scripts/planalto/montar.py /tmp/planalto/extraido/lcp214.json /tmp/planalto/extraido/emc132.json /tmp/planalto/fontes/lcp214.htm /tmp/planalto/fontes/emc132.htm knowledge/rascunho.json /tmp/planalto/extraido/relatorio.json
```

**O rascunho não é a base.** Cada trecho só passa para `knowledge/base.json` depois de conferido por uma pessoa no texto oficial (ver `docs/conferencia-base.md`).
