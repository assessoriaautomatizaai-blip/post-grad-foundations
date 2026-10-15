# knowledge

Base de conhecimento do agente: **um trecho por dispositivo legal** (EC 132/2023 e LC 214/2025), em JSON versionado.

Cada trecho tem `id` estável, `norma`, `dispositivo`, `texto`, `url_fonte` (Planalto) e `data_referencia`. O texto é copiado literalmente do Planalto por `scripts/planalto/montar.py` e conferido contra o texto vigente. Ver ADR-005 e ADR-007 em [docs/decisoes.md](../docs/decisoes.md).

**Estado em 15/10/2026:** 96 trechos. Os 29 originais foram conferidos por pessoa; os 67 da ampliação (dispositivos citados pela base do APP 2) passaram na conferência automática contra o texto vigente e aguardam a conferência humana em [docs/conferencia-base.md](../docs/conferencia-base.md).
