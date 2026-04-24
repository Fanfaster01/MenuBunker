/**
 * Layout raíz de /admin — pasa-todo.
 *
 * El gate de autenticación + shell vive en (protected)/layout.js.
 * Login y callback viven FUERA del grupo (protected) para no entrar al gate.
 */
export default function AdminRootLayout({ children }) {
  return children;
}
