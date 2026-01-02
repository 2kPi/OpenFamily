import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { Pool } from 'pg';

// Configuration VAPID (ces clés doivent être générées une fois et stockées en variable d'environnement)
// To generate VAPID keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKwpdHIzJUphggpc46Pk5oso5SjruMjWiqM5z9ae0lxCnFrbSGihQ5azEWcVhDtiiuqUfsZiJXDHDm857ZyeIeQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'qh85I7kkAUcXzbwEYyKIhlPP-bKs1wfDIy5uYZruHeQ';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@openfamily.app';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export function createPushRoutes(pool: Pool) {
  const router = Router();

  // Enregistrer une subscription push
  router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, subscription, familyId } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({ error: 'userId et subscription sont requis' });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Check if subscription already exists
    const existingSubscription = await pool.query(
      'SELECT id FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );

    if (existingSubscription.rows.length > 0) {
      // Update existing subscription
      await pool.query(
        'UPDATE push_subscriptions SET p256dh = $1, auth = $2, family_id = $3, updated_at = NOW() WHERE user_id = $4 AND endpoint = $5',
        [p256dh, auth, familyId, userId, endpoint]
      );
    } else {
      // Create new subscription
      await pool.query(
        'INSERT INTO push_subscriptions (user_id, family_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4, $5)',
        [userId, familyId, endpoint, p256dh, auth]
      );
    }

    res.json({ success: true, message: 'Subscription enregistrée' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la subscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Désabonner d'une subscription push
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId est requis' });
    }

    await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, message: 'Désabonnement réussi' });
  } catch (error) {
    console.error('Erreur lors du désabonnement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Programmer les notifications pour un rendez-vous
router.post('/schedule-appointment', async (req: Request, res: Response) => {
  try {
    const { appointmentId, appointmentDate, appointmentTime, title, timings, familyId } = req.body;

    console.log('📬 Reçu demande de programmation:', {
      appointmentId,
      appointmentDate,
      appointmentTime,
      title,
      timings,
      familyId
    });

    if (!appointmentId || !appointmentDate || !appointmentTime || !title || !timings || !familyId) {
      console.error('❌ Données manquantes dans la requête');
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    console.log('📅 Date/heure du RDV:', appointmentDateTime);
    console.log('🕐 Maintenant:', new Date());

    // Remove old notifications for this appointment
    await pool.query(
      'DELETE FROM scheduled_notifications WHERE appointment_id = $1',
      [appointmentId]
    );

    let notificationsCreated = 0;
    // Create new notifications
    for (const timing of timings) {
      const scheduledTime = new Date(appointmentDateTime.getTime() - timing.minutes * 60 * 1000);
      
      console.log(`⏰ Délai ${timing.minutes}min → Notification à`, scheduledTime);
      
      // Ne pas programmer si la date est dans le passé
      if (scheduledTime > new Date()) {
        const timeLabel = timing.minutes >= 1440 
          ? `${Math.floor(timing.minutes / 1440)} jour(s)`
          : timing.minutes >= 60
          ? `${Math.floor(timing.minutes / 60)}h${timing.minutes % 60 > 0 ? timing.minutes % 60 + 'min' : ''}`
          : `${timing.minutes} min`;

        // Formater l'heure du RDV (HH:mm)
        const rdvTime = appointmentDateTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        await pool.query(
          'INSERT INTO scheduled_notifications (appointment_id, family_id, title, body, scheduled_time) VALUES ($1, $2, $3, $4, $5)',
          [
            appointmentId,
            familyId,
            'Rappel de rendez-vous',
            `${title} à ${rdvTime} (dans ${timeLabel})`,
            scheduledTime
          ]
        );
        notificationsCreated++;
        console.log(`✅ Notification créée pour ${scheduledTime}`);
      } else {
        console.warn(`⚠️ Notification ignorée (dans le passé): ${scheduledTime}`);
      }
    }

    // Notification à l'heure exacte
    if (appointmentDateTime > new Date()) {
      // Formater l'heure du RDV
      const rdvTime = appointmentDateTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      await pool.query(
        'INSERT INTO scheduled_notifications (appointment_id, family_id, title, body, scheduled_time) VALUES ($1, $2, $3, $4, $5)',
        [
          appointmentId,
          familyId,
          'Rendez-vous',
          `${title} maintenant (${rdvTime})`,
          appointmentDateTime
        ]
      );
      notificationsCreated++;
      console.log(`✅ Notification à l'heure exacte créée pour ${appointmentDateTime}`);
    }

    console.log(`✅ Total: ${notificationsCreated} notification(s) créée(s)`);
    res.json({ success: true, message: 'Notifications programmées', count: notificationsCreated });
  } catch (error) {
    console.error('Erreur lors de la programmation des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DEBUG: Obtenir toutes les notifications programmées
router.get('/debug/scheduled', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scheduled_notifications ORDER BY scheduled_time ASC'
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DEBUG: Obtenir toutes les subscriptions
router.get('/debug/subscriptions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, family_id, endpoint, created_at FROM push_subscriptions'
    );
    res.json({ subscriptions: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des subscriptions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

  return router;
}

// Send push notification to all users in a family
export async function sendPushNotification(
  pool: Pool,
  familyId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Get all family subscriptions
    const result = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE family_id = $1',
      [familyId]
    );

    const subscriptions = result.rows;
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data || {}
    });

    // Envoyer la notification à toutes les subscriptions
    const promises = subscriptions.map(async (sub: any) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
      } catch (error: any) {
        // If subscription is no longer valid, remove it
        if (error.statusCode === 410) {
          await pool.query(
            'DELETE FROM push_subscriptions WHERE endpoint = $1',
            [sub.endpoint]
          );
        }
        console.error('Erreur lors de l\'envoi de la notification:', error);
      }
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications push:', error);
    return false;
  }
}
