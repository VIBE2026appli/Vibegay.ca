# Vibegay.ca

Application React pour VIBE (auth, salons texte/voix, globe, tribunal).

## Développement

```bash
npm install
npm start
```

## Build production

```bash
npm run build
```

## Tests

```bash
CI=true npm test -- --watchAll=false
```

## Variables d'environnement

Créez un fichier `.env` local avec :

```bash
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```