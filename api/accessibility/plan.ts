import { handleAccessibilityRequest } from '../../app/server/accessibility/handler.js';

export default { fetch: (request: Request) => handleAccessibilityRequest(request, 'plan') };
