import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetappController from './app/controllers/MeetappController';
import SubscriptionController from './app/controllers/SubscriptionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.post('/meetapps', MeetappController.store);
routes.put('/meetapps', MeetappController.update);
routes.get('/meetapps', MeetappController.index);
routes.get('/meetappsDate', MeetappController.indexDate);
routes.delete('/meetapps/:id', MeetappController.delete);

routes.post('/subscription', SubscriptionController.store);
routes.get('/subscription', SubscriptionController.index);

export default routes;
