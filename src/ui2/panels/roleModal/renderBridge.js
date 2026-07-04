// Bridge between .js shim (roleModal.js) and .tsx components.
// Rule 10: .js cannot import .ts, so this .js file re-exports .tsx functions.

import { mountRoleModalContent, unmountRoleModalContent } from './RoleModal';

export { mountRoleModalContent, unmountRoleModalContent };
