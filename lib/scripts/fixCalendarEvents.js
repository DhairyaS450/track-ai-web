/**
 * Migration script to fix calendar event date handling issues
 * 
 * This script:
 * 1. Identifies all Google Calendar events in Firestore
 * 2. Fixes all-day event handling issues
 * 3. Ensures consistent date formats for all event types
 * 
 * Run with: node scripts/fixCalendarEvents.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { format } = require('date-fns');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
let fixedCount = 0;
let errorCount = 0;
let totalCount = 0;

/**
 * Fix date formats and handling for calendar events
 */
async function fixCalendarEvents() {
  try {
    console.log('Starting calendar event migration...');
    
    // Get all events from Google Calendar source
    const eventsSnapshot = await db.collection('events')
      .where('source', '==', 'google_calendar')
      .get();
    
    console.log(`Found ${eventsSnapshot.size} Google Calendar events to process`);
    totalCount = eventsSnapshot.size;
    
    // Process each event
    const batch = db.batch();
    let batchCount = 0;
    const batchSize = 450; // Firestore limits batches to 500 operations
    
    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();
      console.log(`Processing event: ${doc.id}, "${event.name}"`);
      
      try {
        const updates = {};
        
        // Handle all-day events
        if (event.isAllDay) {
          console.log(`Fixing all-day event: ${doc.id}, "${event.name}"`);
          
          // Ensure startTime and endTime are in YYYY-MM-DD format for all-day events
          if (event.startTime) {
            // Check if startTime is in YYYY-MM-DD format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(event.startTime)) {
              try {
                // Try to convert to YYYY-MM-DD format
                const dateOnly = event.startTime.split('T')[0];
                updates.startTime = dateOnly;
                console.log(`Fixed startTime format: ${event.startTime} -> ${dateOnly}`);
              } catch (e) {
                console.error(`Error fixing startTime for ${doc.id}:`, e);
              }
            }
          }
          
          if (event.endTime) {
            // Check if endTime is in YYYY-MM-DD format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(event.endTime)) {
              try {
                // Try to convert to YYYY-MM-DD format
                const dateOnly = event.endTime.split('T')[0];
                updates.endTime = dateOnly;
                console.log(`Fixed endTime format: ${event.endTime} -> ${dateOnly}`);
              } catch (e) {
                console.error(`Error fixing endTime for ${doc.id}:`, e);
              }
            }
            
            // For single-day events, if endTime is the same as startTime, add 1 day to endTime
            // to match Google Calendar's exclusive end date convention
            if (updates.endTime === updates.startTime || event.endTime === event.startTime) {
              const startDate = new Date(updates.startTime || event.startTime);
              const nextDay = new Date(startDate);
              nextDay.setDate(nextDay.getDate() + 1);
              updates.endTime = format(nextDay, 'yyyy-MM-dd');
              console.log(`Adjusted all-day event end date: ${event.endTime} -> ${updates.endTime}`);
            }
          }
        } else {
          // Handle timed events - ensure consistent format
          if (event.startTime) {
            // Normalize to yyyy-MM-ddTHH:mm format
            try {
              const date = new Date(event.startTime);
              if (!isNaN(date.getTime())) {
                const formatted = date.toISOString().split('.')[0].substring(0, 16);
                if (formatted !== event.startTime) {
                  updates.startTime = formatted;
                  console.log(`Fixed timed event startTime: ${event.startTime} -> ${formatted}`);
                }
              }
            } catch (e) {
              console.error(`Error fixing timed startTime for ${doc.id}:`, e);
            }
          }
          
          if (event.endTime) {
            // Normalize to yyyy-MM-ddTHH:mm format
            try {
              const date = new Date(event.endTime);
              if (!isNaN(date.getTime())) {
                const formatted = date.toISOString().split('.')[0].substring(0, 16);
                if (formatted !== event.endTime) {
                  updates.endTime = formatted;
                  console.log(`Fixed timed event endTime: ${event.endTime} -> ${formatted}`);
                }
              }
            } catch (e) {
              console.error(`Error fixing timed endTime for ${doc.id}:`, e);
            }
          }
        }
        
        // Apply updates if needed
        if (Object.keys(updates).length > 0) {
          batch.update(doc.ref, updates);
          batchCount++;
          fixedCount++;
          
          console.log(`Added updates for ${doc.id}: ${JSON.stringify(updates)}`);
          
          // Commit batch if it's getting full
          if (batchCount >= batchSize) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }
      } catch (eventError) {
        console.error(`Error processing event ${doc.id}:`, eventError);
        errorCount++;
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`
    Migration complete!
    Total events processed: ${totalCount}
    Events fixed: ${fixedCount}
    Errors: ${errorCount}
    `);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Properly exit the script
    process.exit(0);
  }
}

// Run the migration
fixCalendarEvents().catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
}); 