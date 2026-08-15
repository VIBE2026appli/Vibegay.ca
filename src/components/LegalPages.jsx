import { useState } from 'react';

const T = {
  gold: '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.4)',
  dark: '#050505',
  text: '#EAE0C8',
};

const PAGES = [
  {
    id: 'privacy',
    title: 'Politique de confidentialité',
    content: `
**⚠️ AVIS LÉGAL — ÉBAUCHE NON RÉVISÉE**
Ce texte est un **modèle provisoire**. Il n'a pas été révisé par un·e avocat·e et ne constitue pas un avis juridique. Une révision par un·e juriste qualifié·e en droit québécois (Loi 25 / Loi sur la protection des renseignements personnels dans le secteur privé) est obligatoire avant le lancement.

---

**Responsable de la protection des renseignements personnels**
[NOM ET COORDONNÉES À COMPLÉTER]
E-mail : [EMAIL À COMPLÉTER]

**Renseignements collectés**
Lors de la création d'un compte : adresse courriel, nom d'affichage.
Lors de l'utilisation : interactions dans les salons, participations aux événements.

**Utilisation**
Les renseignements servent uniquement au fonctionnement de la plateforme VIBE.

**Conservation et suppression**
Les données sont conservées tant que le compte est actif. Tu peux demander la suppression de ton compte à tout moment.

**Partage**
Aucune vente ou location de données. Les données peuvent être partagées avec des sous-traitants techniques (hébergement, base de données) dans le respect de la loi.

**Droits**
Tu peux accéder à tes données, les corriger ou demander leur suppression en nous contactant.

*Dernière mise à jour : [DATE À COMPLÉTER]*
`,
  },
  {
    id: 'terms',
    title: "Conditions d'utilisation",
    content: `
**⚠️ AVIS LÉGAL — ÉBAUCHE NON RÉVISÉE**
Ce texte est un **modèle provisoire**. Révision juridique requise avant le lancement.

---

**Utilisation acceptable**
La plateforme VIBE est réservée aux personnes de 18 ans et plus (ou l'âge légal dans ta juridiction). Tout contenu haineux, discriminatoire ou illégal est interdit.

**Comptes**
Tu es responsable de la confidentialité de ton mot de passe et des activités sur ton compte.

**Propriété intellectuelle**
Tout le contenu de la plateforme appartient à VIBE ou à ses auteurs respectifs.

**Limitation de responsabilité**
[À COMPLÉTER selon les exigences du droit québécois]

**Droit applicable**
Ces conditions sont régies par les lois de la province de Québec et les lois fédérales applicables du Canada.

*Dernière mise à jour : [DATE À COMPLÉTER]*
`,
  },
  {
    id: 'refund',
    title: 'Politique de billets et remboursements',
    content: `
**⚠️ AVIS LÉGAL — ÉBAUCHE NON RÉVISÉE**
Ce texte est un **modèle provisoire**. Révision juridique requise avant le lancement.

---

**Billets payants**
La billetterie payante n'est pas encore ouverte. Les conditions de remboursement seront publiées avant l'ouverture de la vente.

**Billets gratuits officiels**
Les billets gratuits officiels sont attribués sur invitation. Ils sont nominatifs, non transférables et non remboursables.

**Annulations d'événement**
En cas d'annulation de l'événement, les détenteurs de billets payants seront remboursés selon la politique en vigueur à la date d'achat.

**Contact**
Pour toute question : [EMAIL À COMPLÉTER]

*Dernière mise à jour : [DATE À COMPLÉTER]*
`,
  },
  {
    id: 'contact',
    title: 'Contact et responsable vie privée',
    content: `
**Coordonnées générales**
VIBE — [ADRESSE À COMPLÉTER]
E-mail général : [EMAIL À COMPLÉTER]

**Responsable de la protection des renseignements personnels**
[NOM À COMPLÉTER]
E-mail : [EMAIL À COMPLÉTER]
Téléphone : [NUMÉRO À COMPLÉTER]

**Pour exercer tes droits (accès, correction, suppression)**
Envoie ta demande à l'adresse ci-dessus avec une preuve d'identité.

**Délai de réponse**
30 jours conformément à la Loi 25.

*Dernière mise à jour : [DATE À COMPLÉTER]*
`,
  },
];

function renderMarkdown(text) {
  // Very minimal: bold, hr, line breaks
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('---')) return <hr key={i} style={{ borderColor: 'rgba(212,175,55,0.3)', margin: '16px 0' }} />;
      if (line.startsWith('**') && line.endsWith('**')) {
        const inner = line.slice(2, -2);
        return <p key={i} style={{ color: T.gold, fontWeight: 600, margin: '12px 0 4px', fontSize: 13 }}>{inner}</p>;
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} style={{ color: T.gold }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return line.trim() ? <p key={i} style={{ color: T.text, margin: '6px 0', fontSize: 13, lineHeight: 1.7 }}>{parts}</p> : <br key={i} />;
    });
}

export default function LegalPages() {
  const [active, setActive] = useState('privacy');
  const page = PAGES.find(p => p.id === active);

  return (
    <div style={{ minHeight: '100vh', background: T.dark, fontFamily: 'Georgia, serif', padding: '24px 16px', maxWidth: 780, margin: '0 auto' }}>
      <h2 style={{ color: T.gold, letterSpacing: 4, fontWeight: 400, fontSize: 18, marginBottom: 24 }}>INFORMATIONS LÉGALES</h2>

      {/* Tab nav */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setActive(p.id)} style={{
            background: active === p.id ? 'rgba(212,175,55,0.12)' : 'transparent',
            border: `1px solid ${active === p.id ? T.gold : T.goldBorder}`,
            color: active === p.id ? T.gold : T.goldBorder,
            padding: '6px 14px', cursor: 'pointer', fontSize: 11,
            letterSpacing: 1, fontFamily: 'Georgia, serif', borderRadius: 4,
          }}>
            {p.title}
          </button>
        ))}
      </div>

      <div style={{ border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: '24px 20px' }}>
        <h3 style={{ color: T.gold, fontWeight: 400, letterSpacing: 3, fontSize: 15, margin: '0 0 20px' }}>
          {page.title.toUpperCase()}
        </h3>
        <div>{renderMarkdown(page.content)}</div>
      </div>

      <p style={{ color: 'rgba(212,175,55,0.3)', fontSize: 10, marginTop: 20, letterSpacing: 1, lineHeight: 1.7 }}>
        ⚠️ Ces pages sont des ébauches provisoires à titre indicatif seulement. Elles ne constituent pas un avis juridique.
        Une révision par un·e avocat·e spécialisé·e en droit québécois (notamment la Loi 25) est requise avant le lancement de la plateforme.
      </p>
    </div>
  );
}
