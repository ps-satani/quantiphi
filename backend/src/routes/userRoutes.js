import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { validateUsername } from '../middleware/validateUsername.js';
import { asyncHandler } from '../utils/httpError.js';

const router = Router();

router.param('username', validateUsername);

router.get('/:username/dashboard', asyncHandler(userController.getDashboardHandler));
router.get('/:username/profile', asyncHandler(userController.getProfile));
router.get('/:username/repos', asyncHandler(userController.getRepos));
router.get('/:username/settings', userController.getSettingsHandler);
router.put('/:username/settings', asyncHandler(userController.updateSettingsHandler));

export default router;
