import cron from 'node-cron';
import { Pool } from 'pg';
import { sendPushNotification } from './pushRoutes';

// Job qui vérifie toutes les minutes les notifications à envoyer
export function startNotificationScheduler(pool: Pool) {
  console.log('Démarrage du scheduler de notifications...');

  // Check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Get all notifications to send
      // (scheduled_time est passé et pas encore envoyée)
      const result = await pool.query(
        `SELECT id, appointment_id, family_id, title, body, scheduled_time
         FROM scheduled_notifications
         WHERE scheduled_time <= $1 AND sent = false
         ORDER BY scheduled_time ASC`,
        [now]
      );

      if (result.rows.length > 0) {
        console.log(`${result.rows.length} notification(s) à envoyer`);
      }

      // Envoyer chaque notification
      for (const notification of result.rows) {
        try {
          await sendPushNotification(
            pool,
            notification.family_id,
            notification.title,
            notification.body,
            {
              appointmentId: notification.appointment_id,
              scheduledTime: notification.scheduled_time
            }
          );

          // Marquer la notification comme envoyée
          await pool.query(
            'UPDATE scheduled_notifications SET sent = true, sent_at = NOW() WHERE id = $1',
            [notification.id]
          );

          console.log(`Notification ${notification.id} envoyée:`, notification.title);
        } catch (error) {
          console.error(`Erreur lors de l'envoi de la notification ${notification.id}:`, error);
        }
      }

      // Nettoyer les anciennes notifications envoyées (plus de 7 jours)
      await pool.query(
        `DELETE FROM scheduled_notifications
         WHERE sent = true AND sent_at < NOW() - INTERVAL '7 days'`
      );

    } catch (error) {
      console.error('Erreur dans le scheduler de notifications:', error);
    }
  });

  console.log('Scheduler de notifications démarré (vérification toutes les minutes)');
}

// Function to stop scheduler gracefully (if needed)
export function stopNotificationScheduler() {
  console.log('Arrêt du scheduler de notifications...');
  // node-cron doesn't have a global stop method, but tasks can be stopped individually
  // Si nécessaire, on peut stocker la référence de la tâche et la stopper
}
