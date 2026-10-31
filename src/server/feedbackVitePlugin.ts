import type { Plugin } from 'vite';
import { handleFeedbackRequest } from './feedbackMiddleware.ts';

export function feedbackPlugin(): Plugin {
  return {
    name: 'cc-feedback-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleFeedbackRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleFeedbackRequest(req, res);
          if (!handled) {
            next();
          }
        } catch (err) {
          next(err);
        }
      });
    }
  };
}
