import type { Metadata } from "next";

import { LegalPage, type LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Términos",
  description: "Condiciones de uso de Lazo de Oro.",
  alternates: { canonical: "/terminos" },
};

const SECTIONS: LegalSection[] = [
  {
    title: { es: "El servicio", en: "The service" },
    paragraphs: [
      {
        es: "Lazo de Oro permite crear, publicar y gestionar gratis la web de una boda. Podemos mejorar, cambiar o dejar de ofrecer funciones con el tiempo.",
        en: "Lazo de Oro lets you create, publish and manage a wedding website for free. We may improve, change or discontinue features over time.",
      },
      {
        es: "Las donaciones son voluntarias y no dan acceso a funciones adicionales.",
        en: "Donations are voluntary and do not unlock additional features.",
      },
    ],
  },
  {
    title: { es: "Tu cuenta", en: "Your account" },
    paragraphs: [
      {
        es: "Para publicar necesitas una cuenta y ser mayor de 18 años. Eres responsable de lo que se publique con tu cuenta y de mantener seguro tu acceso.",
        en: "To publish you need an account and must be at least 18. You are responsible for what is published with your account and for keeping your access secure.",
      },
    ],
  },
  {
    title: { es: "Tu contenido", en: "Your content" },
    paragraphs: [
      {
        es: "Los textos, fotos y música que subes siguen siendo tuyos. Nos das permiso para alojarlos, mostrarlos a tus invitados y traducirlos automáticamente, solo para prestar el servicio.",
        en: "The texts, photos and music you upload remain yours. You give us permission to host them, show them to your guests and translate them automatically, only to provide the service.",
      },
      {
        es: "Debes tener derecho a usar todo lo que subas, incluidas las fotos de otras personas y la música.",
        en: "You must have the right to use everything you upload, including photos of other people and music.",
      },
    ],
  },
  {
    title: { es: "Uso aceptable", en: "Acceptable use" },
    paragraphs: [{ es: "No está permitido usar Lazo de Oro para:", en: "You may not use Lazo de Oro to:" }],
    list: [
      {
        es: "publicar contenido ilegal, ofensivo o que vulnere derechos de otros;",
        en: "publish illegal or offensive content, or content that infringes others' rights;",
      },
      {
        es: "suplantar a otra persona o engañar a los invitados;",
        en: "impersonate someone or mislead guests;",
      },
      {
        es: "enviar spam o pedir dinero de forma fraudulenta;",
        en: "send spam or request money fraudulently;",
      },
      {
        es: "intentar acceder a datos de otras bodas o afectar el funcionamiento del sitio.",
        en: "try to access other weddings' data or disrupt the site.",
      },
    ],
  },
  {
    title: { es: "Regalos", en: "Gifts" },
    paragraphs: [
      {
        es: "Los regalos por Zelle u otros medios se envían directamente de los invitados a los novios. Lazo de Oro no procesa pagos ni interviene en ellos.",
        en: "Gifts sent through Zelle or other means go directly from guests to the couple. Lazo de Oro does not process or take part in those payments.",
      },
    ],
  },
  {
    title: { es: "Duración de la web", en: "How long your website lasts" },
    paragraphs: [
      {
        es: "La web pasa a solo lectura 30 días después de la boda y se archiva a los 12 meses, con aviso previo en el panel. Te recomendamos descargar tus fotos y la lista de invitados antes.",
        en: "The website becomes read-only 30 days after the wedding and is archived after 12 months, with notice in the dashboard first. We recommend downloading your photos and guest list beforehand.",
      },
    ],
  },
  {
    title: { es: "Suspensión", en: "Suspension" },
    paragraphs: [
      {
        es: "Podemos ocultar o suspender una web que incumpla estos términos o ponga en riesgo a otras personas o al servicio.",
        en: "We may hide or suspend a website that breaks these terms or puts other people or the service at risk.",
      },
    ],
  },
  {
    title: { es: "Responsabilidad", en: "Liability" },
    paragraphs: [
      {
        es: "Ofrecemos Lazo de Oro gratis y «tal cual», sin garantías de disponibilidad continua. En la medida que lo permita la ley, no respondemos por daños indirectos ni por la pérdida de contenido; guarda copia de lo que sea importante para ti.",
        en: "We provide Lazo de Oro for free and “as is”, without guarantees of continuous availability. To the extent permitted by law, we are not liable for indirect damages or loss of content; keep a copy of anything important to you.",
      },
    ],
  },
  {
    title: { es: "Cambios", en: "Changes" },
    paragraphs: [
      {
        es: "Podemos actualizar estos términos. Si el cambio es importante, avisaremos en el panel antes de que aplique.",
        en: "We may update these terms. For important changes, we will give notice in the dashboard before they apply.",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title={{ es: "Términos de uso", en: "Terms of use" }}
      updated={{ es: "Última actualización: 16 de octubre de 2026", en: "Last updated: October 16, 2026" }}
      sections={SECTIONS}
    />
  );
}
