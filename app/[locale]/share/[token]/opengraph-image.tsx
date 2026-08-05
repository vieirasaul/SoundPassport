import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import { readPassportShareToken } from "@/lib/share/passport-token";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type SharedPassportImageProps = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function SharedPassportImage({ params }: SharedPassportImageProps) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const passport = readPassportShareToken(token);
  if (!passport || passport.locale !== locale) notFound();
  const dictionary = await getDictionary(locale);

  const field = (label: string, value: string, wide = false) => (
    <div style={{ display: "flex", flexDirection: "column", width: wide ? "100%" : "48%", marginBottom: 22 }}>
      <span style={{ color: "#e4cd8b", fontSize: 15, fontWeight: 700, letterSpacing: 2.2, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: "#fff0bd", fontSize: wide ? 36 : 24, fontWeight: 700, marginTop: 7 }}>{value}</span>
    </div>
  );

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#fafafa", padding: 34, fontFamily: "sans-serif" }}>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", borderRadius: 32, background: "#112a42", border: "7px solid #081a2b", padding: "34px 42px", boxShadow: "0 22px 70px rgba(8,26,43,.28)", color: "#f1d77f" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid rgba(241,215,127,.35)", paddingBottom: 22 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>{dictionary.passportPage.republic}</span>
            <span style={{ marginTop: 6, color: "#fff0bd", fontSize: 40, fontWeight: 800, letterSpacing: 7, textTransform: "uppercase" }}>{dictionary.passportPage.document}</span>
          </div>
          <div style={{ width: 78, height: 78, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "3px solid #f1d77f", fontSize: 42 }}>♫</div>
        </div>
        <div style={{ display: "flex", flex: 1, paddingTop: 30 }}>
          <div style={{ width: 250, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 18, border: "2px solid rgba(241,215,127,.55)", background: "#183652", fontSize: 72 }}>
              {passport.portraitUrl ? <img src={passport.portraitUrl} alt="" width="210" height="210" style={{ width: "210px", height: "210px", objectFit: "cover" }} /> : "♫"}
            </div>
            <span style={{ marginTop: 13, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{dictionary.passportPage.musicalPortrait}</span>
            <div style={{ width: 112, height: 112, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, borderRadius: 999, border: "5px solid rgba(241,215,127,.7)", boxShadow: "inset 0 0 0 5px #112a42, inset 0 0 0 7px rgba(241,215,127,.35)", transform: "rotate(-6deg)", fontSize: 45 }}>♫</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignContent: "flex-start", justifyContent: "space-between", paddingLeft: 42 }}>
            {field(dictionary.passportPage.citizen, passport.name, true)}
            {field(dictionary.passportPage.nationality, passport.nationality)}
            {field(dictionary.passportPage.primaryTerritory, passport.territory)}
            {field(dictionary.passportPage.headOfState, passport.headOfState)}
            {field(dictionary.passportPage.issued, passport.issueDate)}
            {field(dictionary.passportPage.passportNumber, passport.passportNumber, true)}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid rgba(241,215,127,.3)", paddingTop: 16, fontSize: 14, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
          <span>{dictionary.passportPage.issuingAuthority}: SoundPassport</span>
          <span>{dictionary.passportPage.verified}</span>
        </div>
      </div>
    </div>,
    size,
  );
}
