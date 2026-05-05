/**
 * VidyaPath composite router. Mounts all /api/vp/* sub-routers,
 * runs schema bootstrap and seeding on first import.
 *
 * Usage in server.js:
 *   const vidyaPathRouter = require('./routes/vp');
 *   app.use('/api/vp', await vidyaPathRouter(pool, authenticate));
 */
const express = require('express');
const { ensureVpSchema } = require('./migrations');
const { seedVpCatalog } = require('./seed');
const ml = require('../../services/vp/ml_client');
const { providerStatus } = require('../../services/vp/llm_router');

module.exports = async function vidyaPathRouter(pool, authenticate) {
    await ensureVpSchema(pool);
    await seedVpCatalog(pool);

    const router = express.Router();

    router.get('/health', async (_req, res) => {
        const sidecar = await ml.health();
        res.json({
            ok: true,
            service: 'vidyapath',
            ml_sidecar: sidecar,
            llm: providerStatus()
        });
    });

    router.use('/', require('./diagnostic')(pool, authenticate));
    router.use('/', require('./lessons')(pool, authenticate));
    router.use('/', require('./quiz')(pool, authenticate));
    router.use('/', require('./practice')(pool, authenticate));
    router.use('/', require('./voice_tutor')(pool, authenticate));
    router.use('/', require('./career_hub')(pool, authenticate));
    router.use('/', require('./profile')(pool, authenticate));
    router.use('/', require('./notifications')(pool, authenticate));
    router.use('/', require('./sync')(pool, authenticate));
    router.use('/', require('./syllabus')(pool, authenticate));
    router.use('/', require('./teacher_notes')(pool, authenticate));
    router.use('/', require('./personalized')(pool, authenticate));
    router.use('/', require('./admin')(pool, authenticate));

    return router;
};
