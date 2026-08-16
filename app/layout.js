import { Saira_Condensed, Barlow } from 'next/font/google'
import './globals.css'

const titulo = Saira_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--fuente-titulo',
  display: 'swap',
})

const cuerpo = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fuente-cuerpo',
  display: 'swap',
})

export const metadata = {
  title: 'Marco Liendo · Gestión RRSS',
  description:
    'Panel donde el equipo publica el contenido planificado del mes y el cliente lo revisa y aprueba.',
}

export const viewport = {
  themeColor: '#08080a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${titulo.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
