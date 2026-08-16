import LoginForm from './login-form'

export const metadata = {
  title: 'Entrar · TATO MOTOS',
}

export default function LoginPage() {
  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TATO MOTOS 1990 C.A." />
          <div>
            <h1>Panel de contenido</h1>
            <p>TATO MOTOS 1990 C.A.</p>
          </div>
        </div>

        <LoginForm />

        <p className="login-pie">
          ¿No tienes acceso? Escríbele a tu contacto en la agencia
          <br />
          para que te cree un usuario.
        </p>
      </div>
    </main>
  )
}
