"""Monta o rascunho da base a partir dos artigos extraídos do Planalto.

Uso: python3 -I montar.py <lcp214.json> <emc132.json> <lcp214.htm> <emc132.htm> <saida.json> <relatorio.json>

O texto de cada trecho é copiado literalmente dos parágrafos extraídos; nada é redigido.
Seletores (aplicados em sequência, cada um buscando a partir do anterior):
  "caput"  -> 1º parágrafo do artigo
  "caput+" -> 1º parágrafo e os incisos/alíneas logo abaixo, até o primeiro § ou título
  "<prefixo>"  -> o próximo parágrafo que começa com o prefixo
  "<prefixo>+" -> idem, com os incisos/alíneas logo abaixo
"""
import json
import re
import sys

URLS = {
    "LC 214/2025": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm",
    "EC 132/2023": "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm",
}
DATA = "2026-10-14"
SUBITEM = re.compile(r"^([IVXLC]+ ?-|[a-z]\))\s")
INCISO = re.compile(r"^[IVXLC]+ ?-\s")
ALINEA = re.compile(r"^[a-z]\)\s")

# (id, norma, artigo, citado_em, seletores, dispositivo, tema)
SPEC = [
    ("lc214-art1", "LC 214/2025", "1", None, ["caput+"], "art. 1º", "Os novos tributos"),
    ("lc214-art2", "LC 214/2025", "2", None, ["caput"], "art. 2º", "Conceitos-chave"),
    ("lc214-art4", "LC 214/2025", "4", None, ["caput"], "art. 4º, caput", "O que muda"),
    ("lc214-art14", "LC 214/2025", "14", None, ["caput+"], "art. 14, caput", "Os novos tributos"),
    ("lc214-art14-p3", "LC 214/2025", "14", None, ["§ 3º "], "art. 14, § 3º", "Os novos tributos"),
    ("lc214-art31", "LC 214/2025", "31", None, ["caput"], "art. 31, caput", "Conceitos-chave"),
    ("lc214-art41", "LC 214/2025", "41", None, ["caput"], "art. 41, caput", "Quem é afetado"),
    ("lc214-art41-p1-p3", "LC 214/2025", "41", None, ["§ 1º ", "§ 2º ", "§ 3º "], "art. 41, §§ 1º a 3º", "Quem é afetado"),
    ("lc214-art47", "LC 214/2025", "47", None, ["caput"], "art. 47, caput", "Conceitos-chave"),
    ("lc214-art47-p3", "LC 214/2025", "47", None, ["§ 3º "], "art. 47, § 3º", "Quem é afetado"),
    ("lc214-art112", "LC 214/2025", "112", None, ["caput+"], "art. 112", "Conceitos-chave"),
    ("lc214-art113", "LC 214/2025", "113", None, ["caput+"], "art. 113, caput", "Conceitos-chave"),
    ("lc214-art118", "LC 214/2025", "118", None, ["caput+"], "art. 118, caput", "Conceitos-chave"),
    ("lc214-art125", "LC 214/2025", "125", None, ["caput"], "art. 125, caput", "Conceitos-chave"),
    ("lc214-art127", "LC 214/2025", "127", None, ["caput+"], "art. 127, caput", "Quem é afetado"),
    ("lc214-art128", "LC 214/2025", "128", None, ["caput+"], "art. 128", "Quem é afetado"),
    ("lc214-art343", "LC 214/2025", "343", None, ["caput"], "art. 343, caput", "Cronograma de transição"),
    ("lc214-art346", "LC 214/2025", "346", None, ["caput"], "art. 346", "Cronograma de transição"),
    ("lc214-art348-i-ii", "LC 214/2025", "348", None, ["caput", "I - ", "II - +"], "art. 348, caput, incisos I e II", "Cronograma de transição"),
    ("lc214-art348-iii-c", "LC 214/2025", "348", None, ["caput", "III - ", "c) "], "art. 348, caput, inciso III, alínea c", "Quem é afetado"),
    ("lc214-art348-p1", "LC 214/2025", "348", None, ["§ 1º "], "art. 348, § 1º", "Cronograma de transição"),
    ("lc214-art344", "LC 214/2025", "344", None, ["caput"], "art. 344, caput", "Cronograma de transição"),
    ("lc214-art347", "LC 214/2025", "347", None, ["caput"], "art. 347, caput", "Cronograma de transição"),
    ("lc214-art409", "LC 214/2025", "409", None, ["caput", "§ 1º +"], "art. 409, caput e § 1º", "Os novos tributos"),
    ("lc214-art410", "LC 214/2025", "410", None, ["caput"], "art. 410", "Os novos tributos"),
    ("ec132-art8", "EC 132/2023", "8", None, ["caput", "Parágrafo único"], "art. 8º", "Conceitos-chave"),
    ("ec132-adct126", "EC 132/2023", "126", "2", ["caput+"], "art. 2º (ADCT, art. 126)", "O que muda"),
    ("ec132-adct128", "EC 132/2023", "128", "2", ["caput+"], "art. 2º (ADCT, art. 128, caput)", "Cronograma de transição"),
    ("ec132-adct129", "EC 132/2023", "129", "2", ["caput"], "art. 2º (ADCT, art. 129)", "Cronograma de transição"),
]


def limpar(texto):
    # Aspas de abertura/fechamento das citações do ADCT e marca "(NR)" não fazem parte do dispositivo.
    texto = re.sub(r'^[\"“]', "", texto)
    texto = re.sub(r'[\"”]\s*(\(NR\))?$', "", texto)
    return texto.strip()


def selecionar(paragrafos, seletores):
    escolhidos, pos = [], 0
    for seletor in seletores:
        com_subitens = seletor.endswith("+")
        prefixo = seletor[:-1] if com_subitens else seletor
        if prefixo == "caput":
            pos = 0
        else:
            pos = next(i for i in range(pos, len(paragrafos)) if limpar(paragrafos[i]).startswith(prefixo))
        escolhidos.append(paragrafos[pos])
        pos += 1
        if com_subitens:
            # A partir de um inciso, só as alíneas dele; a partir de caput ou §, incisos e alíneas.
            subitem = ALINEA if INCISO.match(limpar(escolhidos[-1])) else SUBITEM
            while pos < len(paragrafos) and subitem.match(limpar(paragrafos[pos])):
                escolhidos.append(paragrafos[pos])
                pos += 1
    return [limpar(p) for p in escolhidos]


def main(lc_json, ec_json, lc_htm, ec_htm, saida, relatorio):
    fontes = {
        "LC 214/2025": (json.load(open(lc_json))["artigos"], open(lc_htm, "rb").read().decode("windows-1252", "replace")),
        "EC 132/2023": (json.load(open(ec_json))["artigos"], open(ec_htm, "rb").read().decode("windows-1252", "replace")),
    }
    trechos, info = [], []
    for id_, norma, artigo, citado_em, seletores, dispositivo, tema in SPEC:
        artigos, html = fontes[norma]
        art = next(a for a in artigos if a["artigo"] == artigo and a["citado_em"] == citado_em)
        texto = "\n".join(selecionar(art["paragrafos"], seletores))
        ancora = f"art{citado_em or artigo}".replace("-", "")
        url = URLS[norma] + (f"#{ancora}" if f'name="{ancora}"' in html else "")
        trechos.append({
            "id": id_, "norma": norma, "dispositivo": dispositivo, "texto": texto,
            "url_fonte": url, "data_referencia": DATA,
        })
        info.append({"id": id_, "tema": tema, "notas": sorted(set(art["notas"])), "chars": len(texto)})
    json.dump(trechos, open(saida, "w"), ensure_ascii=False, indent=2)
    open(saida, "a").write("\n")
    json.dump(info, open(relatorio, "w"), ensure_ascii=False, indent=1)
    print(f"{len(trechos)} trechos gravados em {saida}")


if __name__ == "__main__":
    main(*sys.argv[1:7])
