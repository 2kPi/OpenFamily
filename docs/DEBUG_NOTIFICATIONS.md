# Guide de Debug - Notifications

## Étape 1: Vérifier que le serveur fonctionne

Le serveur devrait afficher au démarrage :
```
✅ Database connection established
✅ Push notification tables migrated
🚀 OpenFamily server running on http://localhost:3001/
Démarrage du scheduler de notifications...
Scheduler de notifications démarré (vérification toutes les minutes)
📬 Notification scheduler started
```

## Étape 2: Vérifier les subscriptions

Ouvre dans ton navigateur ou Postman :
```
http://localhost:3001/api/push/debug/subscriptions
```

Tu devrais voir quelque chose comme :
```json
{
  "subscriptions": [
    {
      "id": 1,
      "user_id": "user-default",
      "family_id": "family-default",
      "endpoint": "https://...",
      "created_at": "2026-01-01T..."
    }
  ]
}
```

**Si vide :** Les notifications ne sont pas activées correctement. Va dans Paramètres > Notifications et active le switch.

## Étape 3: Vérifier les notifications programmées

```
http://localhost:3001/api/push/debug/scheduled
```

Tu devrais voir :
```json
{
  "notifications": [
    {
      "id": 1,
      "appointment_id": "...",
      "family_id": "family-default",
      "title": "Rappel de rendez-vous",
      "body": "Ton RDV dans 1h",
      "scheduled_time": "2026-01-01T13:00:00.000Z",
      "sent": false,
      "created_at": "2026-01-01T..."
    }
  ]
}
```

**Si vide :** Les notifications ne sont pas créées. Vérifie :
1. Que tu as bien activé les rappels dans Paramètres
2. Que tu as coché au moins un délai (1h, 30min, etc.)
3. Que tu crées le rendez-vous APRÈS avoir activé les notifications

## Étape 4: Vérifier la console navigateur

Ouvre DevTools (F12) > Console et cherche :
```
Service Worker enregistré
Subscription push enregistrée
Notifications de rendez-vous programmées
```

**Si erreur :** 
- "Service Worker non supporté" → Utilise Chrome, Firefox ou Edge (pas Safari)
- "Permission refusée" → Va dans les paramètres du site et autorise les notifications
- "Fetch failed" → Le backend n'est pas démarré ou sur le mauvais port

## Étape 5: Vérifier le Service Worker

DevTools > Application > Service Workers

Tu devrais voir `/sw.js` avec status "activated and running"

## Étape 6: Test manuel

### Test immédiat (pour vérifier que ça fonctionne)

1. Ouvre PostgreSQL :
```bash
psql -U postgres -d openfamily
```

2. Insère une notification de test pour dans 1 minute :
```sql
INSERT INTO scheduled_notifications 
(appointment_id, family_id, title, body, scheduled_time, sent)
VALUES 
('test-123', 'family-default', 'Test', 'Notification de test !', NOW() + INTERVAL '1 minute', false);
```

3. Attends 1 minute → Tu devrais recevoir la notification !

4. Vérifie qu'elle a été envoyée :
```sql
SELECT * FROM scheduled_notifications WHERE sent = true;
```

### Logs du scheduler

Le scheduler affiche dans la console :
```
X notification(s) à envoyer
Notification 1 envoyée: Test
```

Si tu ne vois rien, c'est que :
- La scheduled_time est dans le futur
- Le scheduler ne tourne pas
- Il y a une erreur (cherche des messages d'erreur rouges)

## Checklist complète

- [ ] Backend démarré sur port 3001
- [ ] Message "Scheduler de notifications démarré"
- [ ] Base de données PostgreSQL connectée
- [ ] Tables push_subscriptions et scheduled_notifications créées
- [ ] Frontend accessible sur port 3000
- [ ] Paramètres > Notifications > Switch activé
- [ ] Au moins un délai coché (1h, 30min, etc.)
- [ ] Subscription visible dans /api/push/debug/subscriptions
- [ ] Rendez-vous créé avec heure dans le futur
- [ ] Notification visible dans /api/push/debug/scheduled
- [ ] Service Worker enregistré (DevTools > Application)
- [ ] Permissions notifications accordées

## Cas courants

### "Je n'ai rien coché dans les délais"
→ Par défaut, "30 minutes avant" devrait être coché. Si rien n'est coché, aucune notification n'est programmée.

### "J'ai créé le RDV avant d'activer les notifications"
→ Les notifications sont créées AU MOMENT de la création du RDV. Il faut les activer AVANT de créer le RDV.

### "La notification est dans le passé"
→ Le système ne crée pas de notifications pour le passé. Si tu crées un RDV à 14h avec rappel 1h avant, et qu'il est déjà 13h10, la notification ne sera pas créée.

### "Le port est incorrect"
→ Le frontend appelle `/api/push/...` qui est proxied vers le backend. Vérifie vite.config.ts que le proxy pointe vers le bon port (3001).

## Prochaines étapes

Si tout fonctionne en test manuel mais pas en utilisation normale :
1. Vérifie les logs console navigateur (F12)
2. Vérifie les logs serveur backend
3. Vérifie les données en base avec les endpoints /debug
4. Crée un RDV de test pour dans 2 minutes et surveille les logs
