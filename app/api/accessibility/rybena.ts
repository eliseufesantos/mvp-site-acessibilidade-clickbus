import { handleRybenaRequest } from '../../server/accessibility/rybena';

export default { fetch: (request: Request) => handleRybenaRequest(request) };
