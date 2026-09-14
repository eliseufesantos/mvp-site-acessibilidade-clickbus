import { handleAccessibilityRequest } from '../../server/accessibility/handler';

export default { fetch: (request: Request) => handleAccessibilityRequest(request, 'plan') };
