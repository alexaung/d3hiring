// Desc: Routes for teachers

import express from 'express';
import teachersController from '../controllers/teachers-controller';

const router = express.Router();

router.post('/api/register', teachersController.register);

router.get('/api/commonstudents', teachersController.commonstudents);

router.post('/api/suspend', teachersController.suspend);

router.post('/api/retrievefornotifications', teachersController.retrievefornotifications);

export default router;