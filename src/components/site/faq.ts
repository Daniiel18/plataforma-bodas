import type { Bi } from "@/lib/sections";

/** Landing page questions; also published as FAQPage structured data. */
export const FAQ: { q: Bi; a: Bi }[] = [
  {
    q: { es: "¿De verdad es gratis?", en: "Is it really free?" },
    a: {
      es: "Sí. Diseñar, publicar y recibir confirmaciones es gratis, con todas las plantillas y funciones incluidas. Si te gusta, puedes apoyarnos con una donación voluntaria.",
      en: "Yes. Designing, publishing and receiving replies is free, with every template and feature included. If you like it, you can support us with an optional donation.",
    },
  },
  {
    q: { es: "¿Necesito crear una cuenta?", en: "Do I need an account?" },
    a: {
      es: "Para diseñar, no: todo se guarda en tu dispositivo. Solo al publicar te pedimos entrar con Google o con un enlace a tu correo, para que solo ustedes vean las confirmaciones.",
      en: "Not to design it: everything is saved on your device. Only when you publish do we ask you to sign in with Google or an email link, so only you two see the replies.",
    },
  },
  {
    q: { es: "¿Qué incluye la invitación?", en: "What does the invitation include?" },
    a: {
      es: "Sobre animado, cuenta regresiva, calendario con «Añadir al calendario», fotos en 3D, música, mapa con «Cómo llegar», programa, código de vestimenta, regalos con QR de Zelle y confirmación de asistencia con acompañantes y deseos. En español e inglés.",
      en: "Animated envelope, countdown, calendar with “Add to calendar”, 3D photos, music, map with directions, schedule, dress code, gifts with a Zelle QR code and replies with companions and wishes. In Spanish and English.",
    },
  },
  {
    q: { es: "¿Mis invitados necesitan instalar algo?", en: "Do my guests need to install anything?" },
    a: {
      es: "No. Les envías un enlace por WhatsApp, iMessage o redes, y lo abren en su teléfono. Confirman en segundos, sin cuentas ni contraseñas.",
      en: "No. You send them a link by WhatsApp, iMessage or social media and they open it on their phone. They reply in seconds, with no accounts or passwords.",
    },
  },
  {
    q: { es: "¿Puedo cambiarla después de publicarla?", en: "Can I change it after publishing?" },
    a: {
      es: "Sí, cuando quieran y cuantas veces quieran. Los cambios se ven al instante en el mismo enlace.",
      en: "Yes, whenever and as often as you like. Changes show up instantly at the same link.",
    },
  },
  {
    q: { es: "¿Cuánto tiempo estará disponible mi web?", en: "How long will my website stay online?" },
    a: {
      es: "Hasta 30 días después de la boda sigue abierta; luego queda en modo de solo lectura para que la recuerden. A los 12 meses se archiva, y les avisamos antes para que descarguen todo.",
      en: "It stays open until 30 days after the wedding; then it becomes read-only so you can look back on it. After 12 months it is archived, and we let you know beforehand so you can download everything.",
    },
  },
];
