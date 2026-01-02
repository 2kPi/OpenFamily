# Système de Notifications Web Push

## Architecture

Le système de notifications utilise:
- **Frontend**: Service Worker + Push API + Notification API
- **Backend**: Express + Web-Push + PostgreSQL  
- **Scheduler**: node-cron (vérification toutes les minutes)

## Configuration

### 1. Clés VAPID

Les clés VAPID sont déjà configurées dans le code. Pour les régénérer :

```bash
npx web-push generate-vapid-keys
```

Puis mettre à jour :
- `client/src/lib/webPush.ts` : VAPID_PUBLIC_KEY
- `server/pushRoutes.ts` : VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY

Ou utiliser les variables d'environnement :
```bash
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your@email.com
```

### 2. Base de données

Les tables `push_subscriptions` et `scheduled_notifications` sont créées automatiquement au démarrage du serveur.

Structure :
- **push_subscriptions** : stocke les abonnements Web Push des utilisateurs
- **scheduled_notifications** : stocke les notifications à envoyer avec leur date/heure

### 3. Service Worker

Le service worker (`client/public/sw.js`) est enregistré automatiquement au chargement de l'application.

## Utilisation

### Activer les notifications (utilisateur)

1. Aller dans Paramètres > Notifications
2. Cliquer sur "Activer" pour autoriser les notifications navigateur
3. Activer le switch "Rappels de rendez-vous"
4. Cocher les délais souhaités (1 jour, 2h, 1h, 30min, 15min avant)

### Programmer une notification (code)

```typescript
import { scheduleAppointmentNotification } from '@/lib/webPush';

// Lors de la création d'un rendez-vous
scheduleAppointmentNotification(
  appointmentId,
  '2026-01-15',  // date
  '14:30',       // heure
  'Rendez-vous chez le médecin',
  [
    { minutes: 1440, label: '1 jour avant' },
    { minutes: 30, label: '30 minutes avant' }
  ]
);
```

## Flux technique

### 1. Subscription

1. L'utilisateur active les notifications dans les paramètres
2. Le frontend enregistre le Service Worker
3. Le frontend demande la permission navigateur
4. Le frontend crée une PushSubscription avec la clé VAPID publique
5. Le frontend envoie la subscription au backend `/api/push/subscribe`
6. Le backend stocke la subscription en base de données

### 2. Programmation

1. L'utilisateur crée un rendez-vous avec des délais de notification
2. Le frontend appelle `/api/push/schedule-appointment`
3. Le backend calcule les dates/heures de notification
4. Le backend insère les notifications dans `scheduled_notifications`

### 3. Envoi

1. Le scheduler node-cron s'exécute toutes les minutes
2. Il récupère les notifications dont `scheduled_time <= maintenant` et `sent = false`
3. Pour chaque notification :
   - Récupère les subscriptions de la famille
   - Envoie la notification via web-push
   - Marque la notification comme envoyée
4. Nettoie les anciennes notifications (> 7 jours)

### 4. Réception

1. Le Service Worker reçoit l'événement `push`
2. Il affiche la notification avec `showNotification()`
3. L'utilisateur peut cliquer sur la notification pour ouvrir l'app

## Endpoints API

### POST /api/push/subscribe
Enregistre un abonnement push
```json
{
  "userId": "user-id",
  "familyId": "family-id",
  "subscription": {
    "endpoint": "...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

### POST /api/push/unsubscribe
Supprime un abonnement
```json
{
  "userId": "user-id"
}
```

### POST /api/push/schedule-appointment
Programme des notifications pour un rendez-vous
```json
{
  "appointmentId": "appt-id",
  "familyId": "family-id",
  "appointmentDate": "2026-01-15",
  "appointmentTime": "14:30",
  "title": "Rendez-vous médecin",
  "timings": [
    { "minutes": 1440, "label": "1 jour avant" },
    { "minutes": 30, "label": "30 minutes avant" }
  ]
}
```

## Troubleshooting

### Les notifications ne s'affichent pas

1. Vérifier que les permissions sont accordées dans le navigateur
2. Vérifier que le Service Worker est enregistré (DevTools > Application > Service Workers)
3. Vérifier les logs du scheduler backend
4. Vérifier que les notifications sont bien insérées en base :
   ```sql
   SELECT * FROM scheduled_notifications WHERE sent = false;
   ```

### Erreur 410 (Gone)

La subscription n'est plus valide. Elle sera automatiquement supprimée de la base.
L'utilisateur doit se réabonner dans les paramètres.

### Le scheduler ne fonctionne pas

1. Vérifier que le serveur est bien démarré
2. Vérifier les logs : "Démarrage du scheduler de notifications..."
3. Vérifier la connexion PostgreSQL
4. Tester manuellement : créer une notification avec `scheduled_time = NOW()`

## Sécurité

- Les clés VAPID doivent être gardées secrètes côté serveur
- Utiliser HTTPS en production (requis pour Service Workers)
- Valider les données côté backend
- Nettoyer régulièrement les anciennes notifications

## Performance

- Le scheduler vérifie toutes les minutes (configurable dans `scheduler.ts`)
- Les anciennes notifications sont supprimées après 7 jours
- Index sur `scheduled_time` et `sent` pour des requêtes rapides
- Les subscriptions invalides sont automatiquement nettoyées
