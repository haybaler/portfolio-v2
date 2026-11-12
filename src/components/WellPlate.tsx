import { useMemo } from "react";

type Kind = "o" | "i" | "d";

/** The business context engine's well plate: one well per example deal, in a fixed scatter. */
export default function WellPlate({ crmOnly }: { crmOnly: boolean }) {
  const wells = useMemo(() => {
    const k: Kind[] = [...Array<Kind>(16).fill("o"), ...Array<Kind>(5).fill("i"), ...Array<Kind>(24).fill("d")];
    let seed = 11;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280);
    for (let i = k.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [k[i], k[j]] = [k[j], k[i]];
    }
    return k;
  }, []);
  return (
    <div
      className={`plate ${crmOnly ? "crm" : ""}`}
      role="img"
      aria-label={
        crmOnly
          ? "What HubSpot saw: 21 traceable deals; the 24 not-traceable wells are empty."
          : "A 9 by 5 well plate of 45 example deals: 16 originated, 5 influenced, 24 not traceable."
      }
    >
      {wells.map((w, i) => (
        <span key={i} className={`well w-${w}`} />
      ))}
    </div>
  );
}
