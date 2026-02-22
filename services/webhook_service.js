/**
 * Webhook Service
 * Handles configuring, firing, and logging webhooks.
 * Admins register URLs; events in MentorHub trigger HTTP POSTs.
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Supported event types
const WEBHOOK_EVENTS = [
    'submission_graded',
    'test_passed',
    'certificate_issued',
    'plagiarism_flagged',
    'student_at_risk',
    'new_student_enrolled',
    'code_review_completed',
    'mentor_availability_updated'
];

class WebhookService {
    constructor(db) {
        this.db = db;
        this.EVENTS = WEBHOOK_EVENTS;
        this.MAX_RETRIES = 3;
        this.TIMEOUT_MS = 10000;
    }

    /**
     * Create a new webhook
     */
    async createWebhook(adminId, { name, url, secret, events }) {
        // Validate URL
        try { new URL(url); } catch { throw new Error('Invalid webhook URL'); }

        // Validate events
        const invalidEvents = events.filter(e => !this.EVENTS.includes(e));
        if (invalidEvents.length > 0) {
            throw new Error(`Invalid events: ${invalidEvents.join(', ')}. Valid: ${this.EVENTS.join(', ')}`);
        }

        const webhookId = uuidv4();
        await this.db.query(
            `INSERT INTO webhooks (id, admin_id, name, url, secret, events) VALUES (?, ?, ?, ?, ?, ?)`,
            [webhookId, adminId, name, url, secret, JSON.stringify(events)]
        );

        return { webhookId, name, url, events, isActive: true };
    }

    /**
     * Update a webhook
     */
    async updateWebhook(webhookId, updates) {
        const fields = [];
        const values = [];

        if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
        if (updates.url !== undefined) {
            try { new URL(updates.url); } catch { throw new Error('Invalid URL'); }
            fields.push('url = ?'); values.push(updates.url);
        }
        if (updates.secret !== undefined) { fields.push('secret = ?'); values.push(updates.secret); }
        if (updates.events !== undefined) { fields.push('events = ?'); values.push(JSON.stringify(updates.events)); }
        if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }

        if (fields.length === 0) throw new Error('No fields to update');

        values.push(webhookId);
        await this.db.query(`UPDATE webhooks SET ${fields.join(', ')} WHERE id = ?`, values);
        return { success: true };
    }

    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId) {
        await this.db.query('DELETE FROM webhooks WHERE id = ?', [webhookId]);
        return { success: true };
    }

    /**
     * Get all webhooks for an admin
     */
    async getWebhooks(adminId) {
        const [rows] = await this.db.query(
            `SELECT id, name, url, events, is_active, failure_count, last_triggered_at, last_status, created_at
             FROM webhooks WHERE admin_id = ? ORDER BY created_at DESC`,
            [adminId]
        );
        return rows.map(r => ({
            ...r,
            events: typeof r.events === 'string' ? JSON.parse(r.events) : r.events
        }));
    }

    /**
     * Get delivery history for a webhook
     */
    async getDeliveries(webhookId, limit = 50) {
        const [rows] = await this.db.query(
            `SELECT id, event_type, response_status, success, duration_ms, retry_count, delivered_at
             FROM webhook_deliveries WHERE webhook_id = ?
             ORDER BY delivered_at DESC LIMIT ?`,
            [webhookId, limit]
        );
        return rows;
    }

    /**
     * FIRE an event — finds all matching active webhooks and delivers
     * @param {string} eventType - one of WEBHOOK_EVENTS
     * @param {object} data - event payload data
     */
    async fireEvent(eventType, data) {
        if (!this.EVENTS.includes(eventType)) return;

        // Find all active webhooks that subscribe to this event
        const [webhooks] = await this.db.query(
            `SELECT * FROM webhooks WHERE is_active = 1`,
            []
        );

        const subscribers = webhooks.filter(w => {
            const events = typeof w.events === 'string' ? JSON.parse(w.events) : w.events;
            return Array.isArray(events) && events.includes(eventType);
        });

        if (subscribers.length === 0) return;

        // Fire to each subscriber (non-blocking promises)
        for (const webhook of subscribers) {
            this._deliver(webhook, eventType, data).catch(err => {
                console.warn(`Webhook delivery failed [${webhook.id}]:`, err.message);
            });
        }
    }

    /**
     * Deliver payload to one webhook URL with retry logic
     */
    async _deliver(webhook, eventType, data) {
        const deliveryId = uuidv4();
        const payload = {
            id: deliveryId,
            event: eventType,
            timestamp: new Date().toISOString(),
            data
        };

        const body = JSON.stringify(payload);
        const signature = this._sign(body, webhook.secret);

        let lastStatus = null;
        let lastBody = '';
        let success = false;
        let duration = 0;
        let retries = 0;

        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            if (attempt > 0) {
                retries = attempt;
                // Exponential backoff: 2s, 4s, 8s
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            }

            const start = Date.now();
            try {
                const result = await this._httpPost(webhook.url, body, signature);
                duration = Date.now() - start;
                lastStatus = result.status;
                lastBody = result.body.slice(0, 500);
                success = result.status >= 200 && result.status < 300;
                if (success) break;
            } catch (err) {
                duration = Date.now() - start;
                lastBody = err.message;
                lastStatus = 0;
            }
        }

        // Log delivery
        await this.db.query(
            `INSERT INTO webhook_deliveries 
            (id, webhook_id, event_type, payload, response_status, response_body, duration_ms, success, retry_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [deliveryId, webhook.id, eventType, JSON.stringify(payload), lastStatus, lastBody, duration, success ? 1 : 0, retries]
        );

        // Update webhook stats
        if (success) {
            await this.db.query(
                `UPDATE webhooks SET last_triggered_at = NOW(), last_status = ?, failure_count = 0 WHERE id = ?`,
                [lastStatus, webhook.id]
            );
        } else {
            await this.db.query(
                `UPDATE webhooks SET failure_count = failure_count + 1, last_status = ? WHERE id = ?`,
                [lastStatus, webhook.id]
            );
            // Auto-disable after 10 consecutive failures
            await this.db.query(
                `UPDATE webhooks SET is_active = 0 WHERE id = ? AND failure_count >= 10`,
                [webhook.id]
            );
        }

        return { success, status: lastStatus };
    }

    /**
     * HMAC-SHA256 sign the body with the webhook secret
     */
    _sign(body, secret) {
        return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
    }

    /**
     * Low-level HTTP POST
     */
    _httpPost(targetUrl, body, signature) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(targetUrl);
            const isHttps = parsed.protocol === 'https:';
            const lib = isHttps ? https : http;

            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + (parsed.search || ''),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'X-MentorHub-Signature': signature,
                    'X-MentorHub-Event': 'webhook',
                    'User-Agent': 'MentorHub-Webhook/1.0'
                }
            };

            const req = lib.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            });

            req.setTimeout(this.TIMEOUT_MS, () => {
                req.destroy();
                reject(new Error('Webhook request timed out'));
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    /**
     * Test a webhook by sending a test event
     */
    async testWebhook(webhookId) {
        const [rows] = await this.db.query('SELECT * FROM webhooks WHERE id = ?', [webhookId]);
        if (rows.length === 0) throw new Error('Webhook not found');

        const testPayload = {
            message: 'This is a test delivery from MentorHub',
            webhook_id: webhookId,
            timestamp: new Date().toISOString()
        };

        const result = await this._deliver(rows[0], 'test', testPayload);
        return result;
    }

    static get EVENTS() { return WEBHOOK_EVENTS; }
}

module.exports = WebhookService;
module.exports.WEBHOOK_EVENTS = WEBHOOK_EVENTS;
