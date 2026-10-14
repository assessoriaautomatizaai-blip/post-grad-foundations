"""Extrai os parágrafos vigentes de uma página de norma do Planalto.

Uso: python3 -I extrair.py <arquivo.htm> <saida.json>

- Decodifica como windows-1252 (padrão do Planalto).
- Descarta texto riscado (<strike>, <s>, <del>): é redação revogada.
- Separa as notas de alteração "(Redação dada pela ...)", "(Incluído pela ...)" etc.
- Agrupa os parágrafos por artigo ("Art. 1º", "Art. 156-A" ...).
"""
import json
import re
import sys
from html.parser import HTMLParser

RISCADO = {"strike", "s", "del"}
BLOCO = {"p", "h1", "h2", "h3", "h4", "div", "br", "tr", "li"}
NOTA = re.compile(
    r"\((?:Redação dada|Incluíd[oa]|Acrescid[oa]|Vide|Revogad[oa]|Vigência|Produção de efeito|Regulamento|Promulga|Renumerad)[^()]*(?:\([^()]*\)[^()]*)*\)",
    re.I,
)
ARTIGO = re.compile(r"^[\"“]?Art\.\s*(\d+)\s*[ºo°]?\s*(?:-\s*([A-Z]))?", re.I)
TITULO = re.compile(r"^(LIVRO|TÍTULO|CAPÍTULO|Seção|Subseção|Disposições|DISPOSIÇÕES)\b")


class Extrator(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        # Cada entrada: [tag que abriu o riscado, quantas tags com esse nome estão abertas].
        # O Planalto risca texto revogado com <strike> e também com
        # style="text-decoration:line-through" em <span>, <font> ou <p>.
        self.riscos = []
        self.ignorar = 0
        self.atual = []
        self.paragrafos = []

    @property
    def riscado(self):
        return bool(self.riscos)

    def handle_starttag(self, tag, attrs):
        for risco in self.riscos:
            if risco[0] == tag:
                risco[1] += 1
        estilo = (dict(attrs).get("style") or "").lower().replace(" ", "")
        if tag in RISCADO or "line-through" in estilo:
            self.riscos.append([tag, 1])
        if tag in ("script", "style", "head"):
            self.ignorar += 1
        if tag in BLOCO:
            self.fechar()

    def handle_endtag(self, tag):
        for risco in self.riscos:
            if risco[0] == tag:
                risco[1] -= 1
        self.riscos = [risco for risco in self.riscos if risco[1] > 0]
        if tag in ("script", "style", "head") and self.ignorar:
            self.ignorar -= 1
        if tag in BLOCO:
            self.fechar()

    def handle_data(self, data):
        if not self.riscado and not self.ignorar:
            self.atual.append(data)

    def fechar(self):
        texto = re.sub(r"\s+", " ", "".join(self.atual)).strip()
        self.atual = []
        if texto:
            self.paragrafos.append(texto)


def main(origem, destino):
    html = open(origem, "rb").read().decode("windows-1252", errors="replace")
    extrator = Extrator()
    extrator.feed(html)
    extrator.fechar()

    artigos = []
    contexto = []
    for paragrafo in extrator.paragrafos:
        notas = NOTA.findall(paragrafo)
        limpo = re.sub(r"\s+", " ", NOTA.sub("", paragrafo)).strip()
        if not limpo:
            continue
        m = ARTIGO.match(limpo)
        if m:
            numero = m.group(1) + (f"-{m.group(2).upper()}" if m.group(2) else "")
            # Artigo entre aspas é texto de outra norma citado pelo artigo atual
            # (ex.: a EC 132 inserindo artigos no ADCT; a LC 214 alterando outras leis).
            citado = limpo[0] in "\"“"
            pai = next((a["artigo"] for a in reversed(artigos) if not a["citado_em"]), None)
            artigos.append({
                "artigo": numero,
                "citado_em": pai if citado else None,
                "contexto": list(contexto),
                "paragrafos": [],
                "notas": [],
            })
            contexto = []
        elif TITULO.match(limpo) or (limpo.isupper() and len(limpo) > 3):
            contexto.append(limpo)
            continue
        if artigos:
            artigos[-1]["paragrafos"].append(limpo)
            artigos[-1]["notas"].extend(notas)

    json.dump(
        {"paragrafos_total": len(extrator.paragrafos), "artigos": artigos},
        open(destino, "w"),
        ensure_ascii=False,
        indent=1,
    )
    print(f"{origem}: {len(extrator.paragrafos)} parágrafos, {len(artigos)} blocos de artigo")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
