# Vibegay.ca — VIBE Platform

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/VIBE2026appli/Vibegay.ca)

---

## Table des matières
1. [Variables d'environnement](#variables-denvironnement)
2. [Migration de base de données](#migration-de-base-de-données)
3. [Configuration initiale de l'administrateur](#configuration-initiale-de-ladministrateur)
4. [Invitation du co-administrateur](#invitation-du-co-administrateur)
5. [Limites paiements et légal](#limites-paiements-et-légal)
6. [Architecture de sécurité](#architecture-de-sécurité)

---

## Variables d'environnement

Crée un fichier `.env` à la racine du projet (ne jamais le committer) :

```env
# Supabase — requis
REACT_APP_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
REACT_APP_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_PUBLIQUE
```

> **⚠️ Ne jamais mettre la clé service_role dans le code client.**  
> La clé anon est publique et sécurisée par les politiques RLS.

---

## Migration de base de données

Le fichier `supabase/migrations/20260815_vibe_qbc2026.sql` crée :

| Table | Description |
|---|---|
| `profiles` | Profil de chaque utilisateur avec rôle (`admin`, `co_admin`, `attendee`) |
| `events` | Événements — seed : Vibe QBC 2026 |
| `tickets` | Inventaire de billets (standard + gratuits) |
| `comp_allocation` | Compteur d'allocation des 1 000 billets gratuits officiels |
| `audit_log` | Journal d'audit immuable des actions privilégiées |

### Appliquer la migration

**Option A — Supabase CLI :**
```bash
supabase db push
```

**Option B — Dashboard Supabase :**
1. Ouvre le projet sur [supabase.com](https://supabase.com).
2. → SQL Editor → New query.
3. Colle le contenu de `supabase/migrations/20260815_vibe_qbc2026.sql`.
4. Exécute.

---

## Configuration initiale de l'administrateur

Après la migration, tu dois attribuer le rôle `admin` au premier compte :

1. L'admin crée son compte via l'interface (inscription).
2. Dans le dashboard Supabase → **Table Editor → profiles** :
   - Trouve la ligne correspondant à l'e-mail de l'admin.
   - Change la colonne `role` de `attendee` à `admin`.
3. L'admin se reconnecte. Le panneau Admin (🔑) apparaît dans la navigation.

> Cette étape manuelle unique ne peut pas être automatisée sans exposer la clé `service_role` côté client.

---

## Invitation du co-administrateur

Le co-administrateur prévu est **jmarcreid@gmail.com**.

**Procédure :**

1. `jmarcreid@gmail.com` crée un compte VIBE normalement (inscription + confirmation e-mail).
2. L'admin (toi) ouvre le **Panneau Admin → Gestion des rôles**.
3. Trouve la ligne `jmarcreid@gmail.com` et change le rôle de `attendee` à `co_admin`.
4. Clique **Sauver**. Un enregistrement d'audit est créé automatiquement.

**Droits du co_admin :**
- ✅ Voir et gérer les billets et participants
- ✅ Émettre des billets gratuits officiels (dans la limite de 1 000)
- ✅ Modifier le contenu des événements
- ❌ Aucun accès aux paiements, remboursements, Stripe, coordonnées bancaires
- ❌ Ne peut pas modifier les rôles d'autres utilisateurs

> **Sécurité :** Les restrictions du co_admin sont appliquées côté serveur par les politiques RLS et la fonction RPC `issue_comp_ticket`. Le masquage des boutons dans l'interface est une couche additionnelle, non la seule protection.

---

## Limites paiements et légal

### Paiements
- **Aucune intégration de paiement n'est active.** Aucune clé Stripe, aucun stockage de données de carte.
- La billetterie payante affiche un message « prochainement ».
- Pour intégrer un paiement : ajouter `REACT_APP_STRIPE_PUBLISHABLE_KEY` et créer un backend sécurisé (Edge Function ou serveur) qui utilise `STRIPE_SECRET_KEY` — jamais côté client.

### Légal
- Les pages légales (`/legal`) sont des **ébauches provisoires**.
- Une révision par un·e avocat·e spécialisé·e en droit québécois (**Loi 25**, protection des renseignements personnels) est **obligatoire avant le lancement**.
- Les champs `[À COMPLÉTER]` doivent être remplis par l'équipe VIBE.

---

## Architecture de sécurité

| Mécanisme | Détail |
|---|---|
| Authentification | Supabase Auth (e-mail + mot de passe) |
| Autorisation | RLS Supabase sur toutes les tables + vérification dans les RPCs |
| Rôles | `admin` / `co_admin` / `attendee` stockés dans `profiles` |
| Billets gratuits | Émission via RPC `issue_comp_ticket` — vérifie le rôle ET l'allocation en transaction |
| Audit | Table `audit_log` — chaque action privilégiée est enregistrée avec acteur, cible, timestamp |
| Secrets | Aucun secret dans le code — variables d'environnement uniquement |

---

## Développement local

```bash
npm install
# Crée .env avec les variables ci-dessus
npm start
```
