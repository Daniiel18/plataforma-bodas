import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos trata Lazo de Oro, para qué, con quién y por cuánto tiempo.",
  alternates: { canonical: "/privacidad" },
};

const SECTIONS: LegalSection[] = [
  {
    title: { es: "Quiénes somos", en: "Who we are" },
    paragraphs: [
      {
        es: "Lazo de Oro es una plataforma gratuita para crear y publicar la web de una boda. Esta política explica qué datos tratamos, para qué y durante cuánto tiempo.",
        en: "Lazo de Oro is a free platform to create and publish a wedding website. This policy explains what data we process, why and for how long.",
      },
    ],
  },
  {
    title: { es: "Qué datos tratamos", en: "What data we process" },
    paragraphs: [],
    list: [
      {
        es: "Mientras diseñas sin cuenta, todo se guarda solo en tu dispositivo. No recibimos nada hasta que publicas.",
        en: "While you design without an account, everything stays on your device. We receive nothing until you publish.",
      },
      {
        es: "Cuenta de los novios: tu correo y, si entras con Google, tu nombre y foto de perfil.",
        en: "Couple's account: your email and, if you sign in with Google, your name and profile picture.",
      },
      {
        es: "Contenido de la boda: nombres, fecha, lugar, textos, fotos, música y los datos de regalo que decidas mostrar.",
        en: "Wedding content: names, date, venue, texts, photos, music and the gift details you choose to show.",
      },
      {
        es: "Invitados: nombre, si asisten, sus acompañantes, el deseo opcional y el idioma. Para evitar abusos guardamos un código cifrado de la conexión y del enlace personal de cada invitado, nunca la dirección IP en claro.",
        en: "Guests: name, whether they attend, their companions, the optional wish and their language. To prevent abuse we store a hashed code of the connection and of each guest's personal link, never the plain IP address.",
      },
      {
        es: "Uso del sitio: eventos anónimos (páginas vistas, pasos del creador) con un identificador aleatorio guardado en tu dispositivo, el país aproximado y el tipo de dispositivo. No usamos cookies de publicidad ni de seguimiento.",
        en: "Site usage: anonymous events (page views, builder steps) with a random identifier kept on your device, the approximate country and the device type. We use no advertising or tracking cookies.",
      },
    ],
  },
  {
    title: { es: "Para qué los usamos", en: "Why we use it" },
    paragraphs: [
      {
        es: "Para publicar la invitación, mostrar a los novios las respuestas y deseos de sus invitados, enviarles notificaciones, prevenir abusos y mejorar el producto. No vendemos ni cedemos datos a terceros con fines comerciales.",
        en: "To publish the invitation, show the couple their guests' replies and wishes, send them notifications, prevent abuse and improve the product. We do not sell or share data with third parties for commercial purposes.",
      },
    ],
  },
  {
    title: { es: "Quién puede verlos", en: "Who can see it" },
    paragraphs: [
      {
        es: "La web de la boda la ve quien tenga el enlace; no la mostramos en buscadores. Las respuestas y los deseos solo los ven los novios, salvo los deseos que ellos aprueben, uno por uno, para mostrarlos en la invitación con el primer nombre de quien los escribió.",
        en: "Anyone with the link can see the wedding website; we keep it out of search engines. Only the couple sees the replies and wishes, except the wishes they approve, one by one, to show on the invitation with the writer's first name.",
      },
    ],
  },
  {
    title: { es: "Cuánto tiempo los guardamos", en: "How long we keep it" },
    paragraphs: [],
    list: [
      {
        es: "El borrador del creador queda en tu dispositivo hasta que lo borres.",
        en: "The builder's draft stays on your device until you delete it.",
      },
      {
        es: "Una boda con cuenta que nunca se publica se elimina a los 30 días.",
        en: "A wedding that has an account but is never published is deleted after 30 days.",
      },
      {
        es: "La web pasa a solo lectura 30 días después de la boda y se archiva a los 12 meses: se ocultan la página y se eliminan las fotos y la música. Avisamos antes en el panel.",
        en: "The website becomes read-only 30 days after the wedding and is archived after 12 months: the page is hidden and photos and music are deleted. We give notice in the dashboard first.",
      },
      {
        es: "Los eventos anónimos de uso se eliminan a los 13 meses.",
        en: "Anonymous usage events are deleted after 13 months.",
      },
    ],
  },
  {
    title: { es: "Cookies y almacenamiento local", en: "Cookies and local storage" },
    paragraphs: [
      {
        es: "Usamos cookies de sesión solo para que los novios entren a su panel. En tu dispositivo guardamos el idioma elegido, el borrador del creador y el identificador anónimo de uso.",
        en: "We use session cookies only so the couple can sign in to their dashboard. On your device we keep your chosen language, the builder's draft and the anonymous usage identifier.",
      },
    ],
  },
  {
    title: { es: "Tus derechos", en: "Your rights" },
    paragraphs: [
      {
        es: "Puedes pedirnos acceder, corregir o eliminar tus datos. Los novios pueden borrar respuestas desde su panel; si eres invitado y quieres que borremos tu respuesta, escríbenos o pídeselo a los novios.",
        en: "You can ask us to access, correct or delete your data. Couples can delete replies from their dashboard; if you are a guest and want your reply deleted, write to us or ask the couple.",
      },
      {
        es: "Lazo de Oro no está dirigido a menores de 18 años.",
        en: "Lazo de Oro is not intended for people under 18.",
      },
    ],
  },
  {
    title: { es: "Cambios", en: "Changes" },
    paragraphs: [
      {
        es: "Si cambiamos esta política, actualizaremos la fecha de arriba y, si el cambio es importante, avisaremos en el panel.",
        en: "If we change this policy, we will update the date above and, for important changes, give notice in the dashboard.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title={{ es: "Política de privacidad", en: "Privacy policy" }}
      updated={{ es: "Última actualización: 16 de octubre de 2026", en: "Last updated: October 16, 2026" }}
      sections={SECTIONS}
    />
  );
}
