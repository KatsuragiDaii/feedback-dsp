// Ilustrasi dekoratif halaman awal: kotak suara dan empat badge kategori.
// Gambar buatan sendiri; animasi mengambang diatur di globals.css (.fv-art .fl).
export default function GateArt() {
  return (
    <svg className="fv-art" viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
    <radialGradient id="art-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#A7B0FF" stopOpacity=".6"/><stop offset="1" stopColor="#A7B0FF" stopOpacity="0"/></radialGradient>
    <linearGradient id="art-pink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB1C8"/><stop offset="1" stopColor="#FF5C93"/></linearGradient>
    <linearGradient id="art-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE27A"/><stop offset="1" stopColor="#FFA21F"/></linearGradient>
    <linearGradient id="art-orange" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFC48A"/><stop offset="1" stopColor="#FF7B3D"/></linearGradient>
    <linearGradient id="art-cyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A4F0FF"/><stop offset="1" stopColor="#2FA8F2"/></linearGradient>
    <linearGradient id="art-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="1" stopColor="#C6CDFF"/></linearGradient>
    <g id="art-leaf"><path d="M0 0 C30 -70 120 -110 210 -90 C190 -20 110 30 0 0 Z"/><path d="M6 -4 C70 -30 130 -58 200 -86" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2"/></g>
    <path id="art-spark" d="M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3 Z" fill="#fff"/>
    </defs>
    <circle cx="335" cy="325" r="270" fill="url(#art-glow)"/>
    <g fill="#1F25B0" opacity=".55">
    <use href="#art-leaf" transform="translate(612 -8) rotate(148) scale(1.35)"/>
    <use href="#art-leaf" transform="translate(620 70) rotate(122) scale(1.05)"/>
    </g>
    <g fill="#2A1FA8" opacity=".6">
    <use href="#art-leaf" transform="translate(612 650) rotate(-148) scale(1.4)"/>
    <use href="#art-leaf" transform="translate(560 668) rotate(-112) scale(1.1)"/>
    <use href="#art-leaf" transform="translate(300 690) rotate(-75) scale(.9)"/>
    </g>
    <g fill="#3A44D8" opacity=".5">
    <use href="#art-leaf" transform="translate(40 -10) rotate(62)"/>
    <use href="#art-leaf" transform="translate(150 660) rotate(-62)"/>
    </g>
    <circle cx="335" cy="325" r="190" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="2"/>
    <g stroke="#fff" strokeOpacity=".42" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 9" fill="none">
    <path d="M335 325 L190 250"/><path d="M335 325 L470 190"/><path d="M335 325 L480 432"/><path d="M335 325 L200 470"/>
    </g>
    <g transform="translate(335 325)"><g className="fl" style={{animationDelay:'-2s'}}>
    <g transform="rotate(-8)">
    <rect x="-40" y="-92" width="80" height="104" rx="10" fill="#fff"/>
    <path d="M-18 -56 L-6 -43 L18 -72" fill="none" stroke="#4B3FE0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="-24" y="-28" width="48" height="6" rx="3" fill="#C9CEFF"/>
    <rect x="-24" y="-16" width="32" height="6" rx="3" fill="#C9CEFF"/>
    </g>
    <rect x="-76" y="0" width="152" height="108" rx="18" fill="url(#art-box)"/>
    <rect x="-76" y="52" width="152" height="14" fill="#4B3FE0" opacity=".14"/>
    <rect x="-40" y="14" width="80" height="10" rx="5" fill="#3B35D0" opacity=".85"/>
    </g></g>
    <g transform="translate(190 250)"><g className="fl" style={{animationDelay:'-1s'}}>
    <circle r="58" fill="#fff" fillOpacity=".14" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
    <circle r="44" fill="url(#art-pink)"/>
    <ellipse cx="-12" cy="-22" rx="18" ry="9" fill="#fff" fillOpacity=".28" transform="rotate(-25 -12 -22)"/>
    <path d="M0 18 C-30 -2 -24 -26 -10 -24 C-4 -23 0 -18 0 -14 C0 -18 4 -23 10 -24 C24 -26 30 -2 0 18 Z" fill="#fff"/>
    </g></g>
    <g transform="translate(470 190)"><g className="fl" style={{animationDelay:'-3.2s'}}>
    <circle r="62" fill="#fff" fillOpacity=".14" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
    <circle r="48" fill="url(#art-gold)"/>
    <ellipse cx="-13" cy="-24" rx="19" ry="9" fill="#fff" fillOpacity=".3" transform="rotate(-25 -13 -24)"/>
    <polygon transform="scale(1.1)" points="0,-24 5.9,-8.1 22.8,-7.4 9.5,3.1 14.1,19.4 0,10 -14.1,19.4 -9.5,3.1 -22.8,-7.4 -5.9,-8.1" fill="#fff"/>
    </g></g>
    <g transform="translate(480 432)"><g className="fl" style={{animationDelay:'-4.4s'}}>
    <circle r="60" fill="#fff" fillOpacity=".14" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
    <circle r="46" fill="url(#art-orange)"/>
    <ellipse cx="-12" cy="-23" rx="18" ry="9" fill="#fff" fillOpacity=".28" transform="rotate(-25 -12 -23)"/>
    <circle r="22" fill="none" stroke="#fff" strokeWidth="4"/>
    <circle cx="-8" cy="-6" r="3" fill="#fff"/><circle cx="8" cy="-6" r="3" fill="#fff"/>
    <path d="M-11 6 Q0 18 11 6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
    </g></g>
    <g transform="translate(200 470)"><g className="fl" style={{animationDelay:'-5.5s'}}>
    <circle r="56" fill="#fff" fillOpacity=".14" stroke="#fff" strokeOpacity=".5" strokeWidth="3"/>
    <circle r="42" fill="url(#art-cyan)"/>
    <ellipse cx="-11" cy="-21" rx="17" ry="8" fill="#fff" fillOpacity=".3" transform="rotate(-25 -11 -21)"/>
    <g stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M-22 0 L22 0"/><path d="M-22 0 L22 0" transform="rotate(60)"/><path d="M-22 0 L22 0" transform="rotate(120)"/></g>
    </g></g>
    <g opacity=".9">
    <use href="#art-spark" transform="translate(120 140) scale(.8)"/>
    <use href="#art-spark" transform="translate(545 325) scale(.6)"/>
    <use href="#art-spark" transform="translate(300 105) scale(1)"/>
    <use href="#art-spark" transform="translate(95 385) scale(.7)"/>
    <use href="#art-spark" transform="translate(395 565) scale(.9)"/>
    <use href="#art-spark" transform="translate(265 575) scale(.5)"/>
    <use href="#art-spark" transform="translate(560 110) scale(.7)"/>
    </g>
    <g fill="#fff" opacity=".6"><circle cx="262" cy="178" r="3"/><circle cx="548" cy="470" r="3"/><circle cx="84" cy="300" r="2.5"/><circle cx="420" cy="92" r="2.5"/><circle cx="330" cy="520" r="3"/></g>
    </svg>
  );
}
