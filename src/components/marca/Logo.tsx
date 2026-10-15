import { useId } from "react";

import { cn } from "@/lib/utils";

// Marca Inciso. Geometria copiada de docs/marca/inciso-assinatura.svg e inciso-simbolo.svg;
// só as cores mudaram: o traço do I usa --marca-traco (azul-caneta no tema claro, #8099FF no
// escuro, como na versão negativa do manual) e o resto usa a cor do texto (tinta ou papel).
// Regras do manual: abaixo de 72 px de largura, usar só o símbolo; nunca trocar as cores
// do traço e do travessão.

interface PropsLogo {
  className?: string;
  /** Sem nome acessível, para quando o nome "Inciso" já aparece em texto ao lado. */
  decorativo?: boolean;
}

const acessibilidade = (decorativo: boolean | undefined) =>
  decorativo ? { "aria-hidden": true as const } : { role: "img", "aria-label": "Inciso" };

/** Assinatura completa (símbolo + nome). Largura mínima: 72 px. */
export function LogoAssinatura({ className, decorativo }: PropsLogo) {
  const recorte = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 199 68"
      className={cn("h-9 w-auto text-foreground", className)}
      {...acessibilidade(decorativo)}
    >
      <defs>
        <clipPath id={recorte}>
          <rect x="0" y="0" width="171" height="40" />
        </clipPath>
      </defs>
      <g transform="translate(14 14)">
        <g
          fill="none"
          strokeWidth="7"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
          clipPath={`url(#${recorte})`}
        >
          <path data-parte="traco" d="M3.5 0V40" stroke="var(--marca-traco)" />
          <g data-parte="letras" stroke="currentColor">
            <path transform="translate(13 0)" d="M3.5 40V0L27.5 40V0" />
            <path transform="translate(50 0)" d="M31.67 8.33A16.5 16.5 0 1 0 31.67 31.67" />
            <path transform="translate(89 0)" d="M3.5 0V40" />
            <path
              transform="translate(101 0)"
              d="M19.32 6.45A8.25 8.25 0 1 0 13 20A8.25 8.25 0 1 1 6.68 33.55"
            />
            <circle cx="151" cy="20" r="16.5" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Símbolo "I –" (traço e travessão). Tamanho mínimo: 16 px. */
export function LogoSimbolo({ className, decorativo }: PropsLogo) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={cn("size-8 text-foreground", className)}
      {...acessibilidade(decorativo)}
    >
      <rect data-parte="traco" x="11" y="8" width="8" height="32" fill="var(--marca-traco)" />
      <rect data-parte="travessao" x="25" y="21" width="12" height="6" fill="currentColor" />
    </svg>
  );
}
