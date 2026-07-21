import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicStorefront } from "@/features/showcase/public-storefront";
import { getPublicShowcase } from "@/features/showcase/queries";

type PublicShowcasePageProps = {
  params: Promise<{ slug: string }>;
};

function fallbackShowcase(data: NonNullable<Awaited<ReturnType<typeof getPublicShowcase>>>) {
  return {
    hero_image_url: data.organization.cover_url,
    logo_url: data.organization.logo_url,
    title: data.organization.name,
    subtitle: `Agende com ${data.organization.name}`,
    description:
      data.organization.description ||
      "Escolha um servico, veja horarios disponiveis e agende seu atendimento em poucos toques.",
    whatsapp: data.organization.whatsapp,
    instagram_url: null,
    facebook_url: null,
    tiktok_url: null,
    youtube_url: null,
    phone: data.organization.phone,
    address_text: [data.organization.address, data.organization.city, data.organization.state].filter(Boolean).join(", "),
    primary_color: "#be185d",
    theme_key: "beauty",
    font_key: "sans"
  };
}

export async function generateMetadata({ params }: PublicShowcasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicShowcase(slug);

  if (!data?.organization) {
    return {
      title: "Vitrine nao encontrada | Hunter Pro",
      robots: { index: false, follow: false }
    };
  }

  const showcase = data.showcase ?? fallbackShowcase(data);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prospectoads.com";
  const canonical = `${appUrl.replace(/\/$/, "")}/p/${data.organization.slug}`;
  const title = `${showcase.title} | Agendamento online`;
  const description =
    showcase.description ||
    data.organization.description ||
    "Veja servicos, horarios e canais de contato para agendar seu atendimento.";
  const image = showcase.hero_image_url || showcase.logo_url || data.organization.cover_url || data.organization.logo_url || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, alt: showcase.title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function PublicShowcasePage({ params }: PublicShowcasePageProps) {
  const { slug } = await params;
  const data = await getPublicShowcase(slug);

  if (!data?.organization) notFound();

  const showcase = data.showcase ?? fallbackShowcase(data);

  return (
    <PublicStorefront
      organization={data.organization}
      showcase={showcase}
      services={data.services}
      professionals={data.professionals}
      links={data.links}
      gallery={data.gallery}
    />
  );
}
