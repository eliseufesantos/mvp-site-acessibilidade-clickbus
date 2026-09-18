import { handleAccessibilityRequest } from '../../app/server/accessibility/handler';

export default { fetch: (request: Request) => handleAccessibilityRequest(request, 'explain') };
