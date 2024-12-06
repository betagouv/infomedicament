import { MDXRemote } from "next-mdx-remote/rsc";
import { fr } from "@codegouvfr/react-dsfr";
import { getArticles } from "@/data/grist/articles";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";

export const dynamic = "error";
export const dynamicParams = true;

async function getArticle(slug: string) {
  const articles = await getArticles();
  const article = articles.find(({ slug: _slug }) => _slug === slug);

  if (!article) return notFound();

  return article;
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await props.params;

  const { title, description, canonicalUrl } = await getArticle(slug);
  return {
    title: `${title} - ${(await parent).title?.absolute}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page(props0: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props0.params;

  const { title, source, content } = await getArticle(slug);
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "Accueil", linkProps: { href: "/" } },
          {
            label: "Liste des articles",
            linkProps: { href: "/articles" },
          },
        ]}
        currentPageLabel={title}
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1 className={fr.cx("fr-mb-2w")}>{title}</h1>
          <p className={fr.cx("fr-text--light")}>Source&nbsp;: {source}</p>
          <MDXRemote
            source={content}
            components={{
              blockquote: (props) => (
                <div className={fr.cx("fr-callout")}>
                  <div className={fr.cx("fr-callout__title")}>
                    {props.children}
                  </div>
                </div>
              ),
              h1: (props) => (
                <h2 className={fr.cx("fr-h3")}>{props.children}</h2>
              ),
              h2: (props) => (
                <h3 className={fr.cx("fr-h4")}>{props.children}</h3>
              ),
              h3: (props) => (
                <h4 className={fr.cx("fr-h5")}>{props.children}</h4>
              ),
              h4: (props) => (
                <h5 className={fr.cx("fr-h6")}>{props.children}</h5>
              ),
            }}
          />
        </div>
      </div>
    </>
  );
}
