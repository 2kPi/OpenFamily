# Test des Notifications - Guide Pas à Pas

## ⚠️ IMPORTANT: Ordre des étapes

Les étapes doivent être faites **dans cet ordre précis** :

## 1️⃣ Activer les notifications AVANT de créer un RDV

### Étape 1.1: Va dans Paramètres
- Clique sur l'icône Settings (⚙️)
- Scroll jusqu'à la section "Notifications"

### Étape 1.2: Active les permissions navigateur
- Si tu vois "Non configurées" ou "Refusées", clique sur "Activer"
- Une popup du navigateur va s'afficher → clique sur "Autoriser"
- Tu devrais voir "Autorisées par le navigateur" avec une icône verte 🔔

### Étape 1.3: Active les rappels de rendez-vous
- Active le switch "Rappels de rendez-vous"
- Le switch devrait devenir bleu/vert

### Étape 1.4: Coche au moins un délai
- Coche "1 heure avant" (pour tester rapidement)
- Tu peux aussi cocher "30 minutes avant" et "15 minutes avant"
- Ne coche PAS "1 jour avant" pour les tests rapides

**Vérification console:**
- Ouvre DevTools (F12) > Console
- Tu devrais voir:
  ```
  Service Worker enregistré
  Subscription push enregistrée
  ```

## 2️⃣ Crée un rendez-vous

### Étape 2.1: Va dans Rendez-vous
- Clique sur "Rendez-vous" dans la navigation

### Étape 2.2: Crée un RDV
- Clique sur le bouton "+" en bas à droite
- Remplis:
  - **Titre:** "Test notification"
  - **Date:** Aujourd'hui
  - **Heure:** Dans 1h05 (ex: s'il est 14h00, mets 15h05)
  - **Type:** Peu importe
- Clique sur "Ajouter"

### Étape 2.3: Vérifie les logs
**Console navigateur (F12):**
```
🔔 Vérification notifications... {enabled: true, ...}
🔔 Délais activés: [{id: "hour1", minutes: 60, ...}]
🔔 Programmation notifications pour RDV: {id: "...", date: "2026-01-01", ...}
✅ Notifications programmées avec succès
```

**Console serveur (terminal backend):**
```
📬 Reçu demande de programmation: {appointmentId: "...", ...}
📅 Date/heure du RDV: 2026-01-01T15:05:00.000Z
🕐 Maintenant: 2026-01-01T14:00:00.000Z
⏰ Délai 60min → Notification à 2026-01-01T14:05:00.000Z
✅ Notification créée pour 2026-01-01T14:05:00.000Z
✅ Total: 2 notification(s) créée(s)
```

## 3️⃣ Vérifie que les notifications sont en base

Ouvre dans ton navigateur:
```
http://localhost:3001/api/push/debug/scheduled
```

Tu devrais voir:
```json
{
  "notifications": [
    {
      "id": 1,
      "appointment_id": "abc123",
      "title": "Rappel de rendez-vous",
      "body": "Test notification dans 1h",
      "scheduled_time": "2026-01-01T14:05:00.000Z",
      "sent": false
    },
    {
      "id": 2,
      "title": "Rendez-vous maintenant !",
      "body": "Test notification",
      "scheduled_time": "2026-01-01T15:05:00.000Z",
      "sent": false
    }
  ]
}
```

## 4️⃣ Attends la notification

- Laisse la fenêtre ouverte (ou en arrière-plan)
- Attends 5 minutes (jusqu'à 14h05 dans notre exemple)
- Tu devrais recevoir une notification !

**Dans le terminal backend, tu verras:**
```
1 notification(s) à envoyer
Notification 1 envoyée: Rappel de rendez-vous
```

## 🐛 Problèmes courants

### "Je ne vois aucun log 🔔 dans la console"
→ Les notifications ne sont pas activées ou les délais ne sont pas cochés
→ Va dans Paramètres > Notifications et vérifie

### "Erreur fetch dans la console"
→ Le backend n'est pas démarré ou le proxy ne fonctionne pas
→ Vérifie que le serveur tourne sur http://localhost:3001
→ Redémarre Vite si tu viens de modifier vite.config.ts

### "Aucune notification dans /debug/scheduled"
→ La requête n'a pas atteint le backend
→ Vérifie les logs serveur (tu devrais voir "📬 Reçu demande...")
→ Vérifie que familyId est bien "family-default"

### "Notification dans le passé"
→ Le système ne crée pas de notifications passées
→ Si tu crées un RDV à 15h05 et qu'il est déjà 14h10, la notification "1h avant" (14h05) ne sera pas créée
→ Crée un RDV avec plus de marge (ex: dans 1h10)

### "Le scheduler ne détecte rien"
→ Vérifie l'heure de scheduled_time en base
→ Le scheduler vérifie `scheduled_time <= NOW()`
→ Utilise des timestamps UTC (le serveur utilise UTC)

### "Permission refusée"
→ Tu as peut-être cliqué sur "Bloquer" par erreur
→ Va dans les paramètres du site (icône 🔒 dans la barre d'adresse)
→ Change "Notifications" de "Bloquer" à "Autoriser"
→ Recharge la page

## ✅ Test de validation rapide

Pour être sûr que tout fonctionne, fais ce test:

1. **Vérifie PostgreSQL** (dans psql):
```sql
INSERT INTO scheduled_notifications 
(appointment_id, family_id, title, body, scheduled_time, sent)
VALUES 
('test-manual', 'family-default', 'Test manuel', 'Ça marche !', NOW() + INTERVAL '30 seconds', false);
```

2. **Attends 30 secondes**
3. **Tu devrais recevoir "Test manuel - Ça marche !"**

Si ça ne marche pas:
- Vérifie `/api/push/debug/subscriptions` (doit avoir au moins 1 subscription)
- Vérifie les logs du scheduler dans le terminal backend
- Vérifie que le Service Worker est actif (DevTools > Application > Service Workers)

## 📱 Pour tester sur mobile

1. Le site doit être en HTTPS (ou localhost)
2. Active les notifications dans les paramètres du site
3. Même process que ci-dessus
4. Les notifications apparaissent comme des notifications système

## 🎯 Checklist finale

Avant de dire "ça ne marche pas", vérifie:
- [ ] Backend démarré (logs "Scheduler started")
- [ ] Frontend démarré (Vite sur port 3000)
- [ ] Proxy configuré dans vite.config.ts
- [ ] Permissions accordées dans le navigateur
- [ ] Switch "Rappels" activé AVANT de créer le RDV
- [ ] Au moins un délai coché
- [ ] RDV créé avec assez de marge (1h10 minimum pour tester "1h avant")
- [ ] Logs visibles dans console navigateur ET serveur
- [ ] Au moins 1 subscription dans /debug/subscriptions
- [ ] Au moins 1 notification dans /debug/scheduled
