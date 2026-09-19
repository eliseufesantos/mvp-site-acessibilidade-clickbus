import { handleRybenaRequest } from '../../app/server/accessibility/rybena';

export default { fetch: (request: Request) => handleRybenaRequest(request) };
