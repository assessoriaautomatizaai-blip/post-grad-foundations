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


# Ampliação de 15/10/2026 (ADR-007): dispositivos citados pela base do APP 2, copiados
# literalmente da versão vigente (já com a LC 227/2026).
DATA_APP2 = "2026-10-15"
LC, EC = "LC 214/2025", "EC 132/2023"
SPEC_APP2 = [
    ("ec132-adct125", EC, "125", '2', ['caput', '§ 1º ', '§ 2º '], "art. 2º (ADCT, art. 125, caput e §§ 1º e 2º)", "APP 2, pergunta 05"),
    ("ec132-adct125-p4", EC, "125", '2', ['§ 4º '], "art. 2º (ADCT, art. 125, § 4º)", "APP 2, pergunta 06"),
    ("ec132-adct127", EC, "127", '2', ['caput', 'Parágrafo único'], "art. 2º (ADCT, art. 127)", "APP 2, pergunta 07-08"),
    ("ec132-adct92b", EC, "92-B", '2', ['caput'], "art. 2º (ADCT, art. 92-B, caput)", "APP 2, pergunta 57"),
    ("lc214-art3", LC, "3", None, ['caput+'], "art. 3º, caput", "APP 2, pergunta 17"),
    ("lc214-art7a-pu", LC, "7-A", None, ['Parágrafo único+'], "art. 7º-A, parágrafo único", "APP 2, pergunta 43"),
    ("lc214-art8", LC, "8", None, ['caput'], "art. 8º", "APP 2, pergunta 28"),
    ("lc214-art10", LC, "10", None, ['caput'], "art. 10, caput", "APP 2, pergunta 17"),
    ("lc214-art12", LC, "12", None, ['caput', '§ 2º +'], "art. 12, caput e § 2º", "APP 2, pergunta 20"),
    ("lc214-art15", LC, "15", None, ['caput+', 'Parágrafo único'], "art. 15", "APP 2, pergunta 19"),
    ("lc214-art16", LC, "16", None, ['caput', 'Parágrafo único'], "art. 16", "APP 2, pergunta 21"),
    ("lc214-art18", LC, "18", None, ['caput+'], "art. 18", "APP 2, pergunta 21"),
    ("lc214-art19", LC, "19", None, ['caput+'], "art. 19, caput", "APP 2, pergunta 22"),
    ("lc214-art26-iv", LC, "26", None, ['caput', 'IV - '], "art. 26, caput, inciso IV", "APP 2, pergunta 42"),
    ("lc214-art26-vi", LC, "26", None, ['caput', 'VI - '], "art. 26, caput, inciso VI", "APP 2, pergunta 41"),
    ("lc214-art26-p10", LC, "26", None, ['§ 10. '], "art. 26, § 10", "APP 2, pergunta 42"),
    ("lc214-art27", LC, "27", None, ['caput+'], "art. 27, caput", "APP 2, pergunta 25"),
    ("lc214-art35", LC, "35", None, ['caput', '§ 2º '], "art. 35, caput e § 2º", "APP 2, pergunta 26"),
    ("lc214-art39", LC, "39", None, ['caput'], "art. 39, caput", "APP 2, pergunta 24"),
    ("lc214-art41-p4-p5", LC, "41", None, ['§ 4º ', '§ 5º '], "art. 41, §§ 4º e 5º", "APP 2, pergunta 50"),
    ("lc214-art47-p9", LC, "47", None, ['§ 9º +'], "art. 47, § 9º", "APP 2, pergunta 52"),
    ("lc214-art49", LC, "49", None, ['caput'], "art. 49, caput", "APP 2, pergunta 23"),
    ("lc214-art51", LC, "51", None, ['caput', '§ 2º '], "art. 51, caput e § 2º", "APP 2, pergunta 23/28"),
    ("lc214-art52", LC, "52", None, ['caput'], "art. 52", "APP 2, pergunta 23"),
    ("lc214-art53", LC, "53", None, ['caput+', '§ 1º '], "art. 53, caput e § 1º", "APP 2, pergunta 23/24"),
    ("lc214-art54", LC, "54", None, ['caput'], "art. 54", "APP 2, pergunta 23"),
    ("lc214-art57", LC, "57", None, ['caput+'], "art. 57, caput", "APP 2, pergunta 23"),
    ("lc214-art60", LC, "60", None, ['caput'], "art. 60, caput", "APP 2, pergunta 27"),
    ("lc214-art63", LC, "63", None, ['caput'], "art. 63, caput", "APP 2, pergunta 18"),
    ("lc214-art79", LC, "79", None, ['caput'], "art. 79, caput", "APP 2, pergunta 28"),
    ("lc214-art115", LC, "115", None, ['caput'], "art. 115", "APP 2, pergunta 40"),
    ("lc214-art116", LC, "116", None, ['caput'], "art. 116, caput", "APP 2, pergunta 40"),
    ("lc214-art117", LC, "117", None, ['caput'], "art. 117, caput", "APP 2, pergunta 39/40"),
    ("lc214-art123", LC, "123", None, ['caput+'], "art. 123", "APP 2, pergunta 40"),
    ("lc214-art133", LC, "133", None, ['caput'], "art. 133, caput", "APP 2, pergunta 34"),
    ("lc214-art135", LC, "135", None, ['caput'], "art. 135, caput", "APP 2, pergunta 32"),
    ("lc214-art136", LC, "136", None, ['caput'], "art. 136, caput", "APP 2, pergunta 33"),
    ("lc214-art143", LC, "143", None, ['caput+'], "art. 143, caput", "APP 2, pergunta 35"),
    ("lc214-art144", LC, "144", None, ['caput'], "art. 144, caput", "APP 2, pergunta 35"),
    ("lc214-art145", LC, "145", None, ['caput'], "art. 145, caput", "APP 2, pergunta 35"),
    ("lc214-art146", LC, "146", None, ['caput'], "art. 146, caput", "APP 2, pergunta 34"),
    ("lc214-art147", LC, "147", None, ['caput+'], "art. 147, caput", "APP 2, pergunta 35"),
    ("lc214-art148", LC, "148", None, ['caput'], "art. 148, caput", "APP 2, pergunta 31"),
    ("lc214-art157", LC, "157", None, ['caput'], "art. 157, caput", "APP 2, pergunta 36"),
    ("lc214-art164", LC, "164", None, ['caput'], "art. 164, caput", "APP 2, pergunta 41"),
    ("lc214-art165", LC, "165", None, ['caput'], "art. 165, caput", "APP 2, pergunta 41"),
    ("lc214-art167", LC, "167", None, ['caput'], "art. 167", "APP 2, pergunta 41"),
    ("lc214-art172", LC, "172", None, ['caput+'], "art. 172, caput", "APP 2, pergunta 58"),
    ("lc214-art173", LC, "173", None, ['caput'], "art. 173, caput", "APP 2, pergunta 58"),
    ("lc214-art251", LC, "251", None, ['caput', '§ 1º +'], "art. 251, caput e § 1º", "APP 2, pergunta 53"),
    ("lc214-art253", LC, "253", None, ['caput'], "art. 253, caput", "APP 2, pergunta 53"),
    ("lc214-art257", LC, "257", None, ['caput'], "art. 257, caput", "APP 2, pergunta 55"),
    ("lc214-art259", LC, "259", None, ['caput'], "art. 259, caput", "APP 2, pergunta 55"),
    ("lc214-art260", LC, "260", None, ['caput'], "art. 260, caput", "APP 2, pergunta 55"),
    ("lc214-art261", LC, "261", None, ['caput+'], "art. 261", "APP 2, pergunta 54"),
    ("lc214-art368", LC, "368", None, ['caput'], "art. 368, caput", "APP 2, pergunta 22"),
    ("lc214-art369", LC, "369", None, ['caput'], "art. 369, caput", "APP 2, pergunta 22"),
    ("lc214-art409-p2", LC, "409", None, ['§ 2º +'], "art. 409, § 2º", "APP 2, pergunta 45"),
    ("lc214-art411", LC, "411", None, ['caput'], "art. 411, caput", "APP 2, pergunta 44"),
    ("lc214-art413", LC, "413", None, ['caput+'], "art. 413", "APP 2, pergunta 46"),
    ("lc214-art419", LC, "419", None, ['caput'], "art. 419, caput", "APP 2, pergunta 47"),
    ("lc214-art421", LC, "421", None, ['caput'], "art. 421, caput", "APP 2, pergunta 47"),
    ("lc214-art422", LC, "422", None, ['caput'], "art. 422, caput", "APP 2, pergunta 47"),
    ("lc214-art426", LC, "426", None, ['caput'], "art. 426", "APP 2, pergunta 46"),
    ("lc214-art439", LC, "439", None, ['caput'], "art. 439", "APP 2, pergunta 57"),
    ("lc214-art445", LC, "445", None, ['caput'], "art. 445, caput", "APP 2, pergunta 57"),
    ("lc214-art480", LC, "480", None, ['caput'], "art. 480, caput", "APP 2, pergunta 16"),
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
    lista = [(e, DATA) for e in SPEC] + [(e, DATA_APP2) for e in SPEC_APP2]
    for (id_, norma, artigo, citado_em, seletores, dispositivo, tema), data in lista:
        artigos, html = fontes[norma]
        art = next(a for a in artigos if a["artigo"] == artigo and a["citado_em"] == citado_em)
        texto = "\n".join(selecionar(art["paragrafos"], seletores))
        ancora = f"art{citado_em or artigo}".replace("-", "")
        url = URLS[norma] + (f"#{ancora}" if f'name="{ancora}"' in html else "")
        trechos.append({
            "id": id_, "norma": norma, "dispositivo": dispositivo, "texto": texto,
            "url_fonte": url, "data_referencia": data,
        })
        info.append({"id": id_, "tema": tema, "notas": sorted(set(art["notas"])), "chars": len(texto)})
    json.dump(trechos, open(saida, "w"), ensure_ascii=False, indent=2)
    open(saida, "a").write("\n")
    json.dump(info, open(relatorio, "w"), ensure_ascii=False, indent=1)
    print(f"{len(trechos)} trechos gravados em {saida}")


if __name__ == "__main__":
    main(*sys.argv[1:7])
