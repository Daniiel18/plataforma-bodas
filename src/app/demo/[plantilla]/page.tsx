import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DemoPage, demoMetadata } from "@/components/site/demo-page";
import { TEMPLATES } from "@/lib/templates";

/** One indexable demo per template, prerendered; any other path is a 404. */
export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ plantilla: template.key }));
}

const isTemplate = (key: string) => TEMPLATES.some((template) => template.key === key);

export async function generateMetadata({ params }: PageProps<"/demo/[plantilla]">): Promise<Metadata> {
  const { plantilla } = await params;
  return isTemplate(plantilla) ? demoMetadata(plantilla) : {};
}

export default async function TemplateDemo({ params }: PageProps<"/demo/[plantilla]">) {
  const { plantilla } = await params;
  if (!isTemplate(plantilla)) notFound();
  return <DemoPage templateKey={plantilla} />;
}
