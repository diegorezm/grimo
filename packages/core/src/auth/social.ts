/**
 * Why a Google/Apple sign-in came back without a session (the `error` the auth server puts in
 * the return URL), in pt-BR. Null when there is nothing to tell.
 */
export function socialSignInError(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "account_not_linked") {
    // The email already has a password account that was never confirmed: linking it to the
    // provider would let whoever set that password in (account pre-hijacking).
    return "Esse email já tem uma conta com senha. Entre com email e senha; depois de confirmar o email, o Google também funciona.";
  }
  return "Não deu para entrar com essa conta. Tente de novo.";
}
